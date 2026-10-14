<?php
// Isolated service contracts using real Eloquent/SQLite, without booting the CRM.
// Usage: php tests/backend/continuation.php /path/to/vendor/autoload.php
namespace {
    $backendRoot = $argv[2] ?? dirname(__DIR__, 4).'/skin-genious-crm-and-api';
    $autoload = $argv[1] ?? $backendRoot.'/vendor/autoload.php';
    if (!is_file($autoload)) { fwrite(STDERR, "Pass a Composer autoloader with Illuminate database/validation and Ramsey UUID.\n"); exit(1); }
    require $autoload;
    if (!function_exists('now')) { function now() { return \Illuminate\Support\Carbon::now(); } }
    if (!function_exists('abort')) { function abort($code, $message = '') { throw new \RuntimeException($message, $code); } }
}
namespace App\Models {
    class Assessment extends \Illuminate\Database\Eloquent\Model {
        protected $guarded = [];
        protected $casts = ['diagnosis'=>'array','parameters_with_abnormal_scores'=>'array','facial_course_progress'=>'array',
            'medical_history'=>'array','allergies'=>'array','is_pregnant'=>'boolean'];
        public function treatmentSessions() { return $this->hasMany(TreatmentSession::class); }
        public function user() { return $this->belongsTo(User::class); }
    }
    class TreatmentSession extends \Illuminate\Database\Eloquent\Model {
        protected $guarded = [];
        public function assessment() { return $this->belongsTo(Assessment::class); }
        protected $casts = ['steps'=>'array','post_diagnosis'=>'array','post_feature_packet'=>'array','post_images'=>'array',
            'concerns_addressed'=>'array','preparations_checklist_for_therapist'=>'array','daily_home_care_routine'=>'array','session_number'=>'integer'];
    }
    class User extends \Illuminate\Database\Eloquent\Model { protected $guarded = []; }
}
namespace {
    use App\Models\Assessment;
    use App\Models\TreatmentSession;
    use App\Models\User;
    use Illuminate\Database\Capsule\Manager as Capsule;
    use Illuminate\Support\Facades\Facade;
    use Illuminate\Support\Facades\Storage;
    use Illuminate\Support\Facades\Log;

    // Laravel's Composer autoloader provides abort(); support it without booting the CRM.
    $container = new class extends \Illuminate\Container\Container {
        public function abort($code, $message = '', array $headers = []) {
            throw new \RuntimeException($message, $code);
        }
    };
    \Illuminate\Container\Container::setInstance($container);
    $db = new Capsule($container);
    $db->addConnection(['driver'=>'sqlite','database'=>':memory:','prefix'=>'']);
    $db->setAsGlobal(); $db->bootEloquent();
    $container->instance('db', $db->getDatabaseManager());
    $container->instance('db.schema', $db->schema());
    Facade::setFacadeApplication($container);
    $translator = new \Illuminate\Translation\Translator(new \Illuminate\Translation\ArrayLoader, 'en');
    $container->instance('validator', new \Illuminate\Validation\Factory($translator, $container));
    $disk = new class {
        public array $files = []; public bool $failWrites = false;
        public function exists($path) { return array_key_exists($path, $this->files); }
        public function get($path) { return $this->files[$path]; }
        public function put($path, $contents) { if ($this->failWrites) return false; $this->files[$path]=$contents; return true; }
        public function disk($name) { return $this; }
    };
    Storage::swap($disk);
    $log = new class { public array $warnings=[]; public function warning($text, $context=[]) { $this->warnings[]=$text; } };
    Log::swap($log);
    $db->schema()->create('users', function ($t) { $t->id(); $t->string('gender')->nullable(); $t->string('face_scan_machine')->nullable(); $t->timestamps(); });
    $db->schema()->create('assessments', function ($t) {
        $t->id(); $t->integer('user_id'); $t->string('selected_plan_type'); $t->string('total_time')->nullable(); $t->integer('age')->nullable();
        foreach (['diagnosis','parameters_with_abnormal_scores','medical_history','allergies'] as $name) $t->json($name)->nullable();
        $t->timestamps();
    });
    $migration = require $backendRoot.'/database/migrations/2026_10_14_000001_add_facial_course_progress_to_assessments.php';
    $migration->up();
    $db->schema()->create('treatment_sessions', function ($t) {
        $t->id(); $t->integer('assessment_id'); $t->integer('user_id'); $t->integer('session_number'); $t->string('plan_type')->default('multiple');
        $t->string('title')->nullable(); $t->double('treatment_time')->nullable(); $t->double('week')->nullable(); $t->string('status')->default('pending');
        foreach (['steps','post_diagnosis','post_feature_packet','post_images','concerns_addressed','preparations_checklist_for_therapist','daily_home_care_routine'] as $name) $t->json($name)->nullable();
        $t->text('audio_text')->nullable(); $t->timestamps(); $t->unique(['assessment_id','session_number']);
    });
    require $backendRoot.'/app/Services/FacialCourseContinuation.php';
    $service = new \App\Services\FacialCourseContinuation;
    $fixture = json_decode(file_get_contents(dirname(__DIR__).'/fixtures/continuation-case.json'), true);
    $passed = 0;
    function check($condition, $message) { if (!$condition) throw new \RuntimeException($message); }
    function expectFailure(callable $operation, $contains = '') {
        try { $operation(); } catch (\Throwable $error) {
            if ($contains !== '') check(str_contains($error->getMessage(), $contains) || $error instanceof \Illuminate\Validation\ValidationException, 'Wrong failure: '.$error->getMessage());
            return $error;
        }
        throw new \RuntimeException('Expected operation to fail.');
    }
    function runContract($name, callable $check) { global $passed; $check(); $passed++; echo "PASS $name\n"; }
    function caseData($total, $after) {
        $path=dirname(__DIR__).'/generated-cases/'.$total.'-after-'.$after.'.json';
        if (!is_file($path)) throw new \RuntimeException('Run the Node tests first to produce validated generated-cases fixtures.');
        return json_decode(file_get_contents($path), true);
    }
    function seed($total, $type='multiple') {
        global $fixture, $disk;
        $case=caseData($total, 2);
        $user=User::create(['gender'=>'Female','face_scan_machine'=>'5_light_modes']);
        $assessment=Assessment::create(['user_id'=>$user->id,'selected_plan_type'=>$type,'age'=>35,
            'diagnosis'=>$fixture['diagnosis'],'parameters_with_abnormal_scores'=>$fixture['diagnosis']['treatable_concerns_summary'],
            'medical_history'=>['None'],'allergies'=>['None']]);
        $initial=[];
        foreach ([1,2] as $number) {
            $protocol=$fixture['draft']['planning_result']['treatment_plan']['treatments'][0];
            $protocol['session_number']=$number; $protocol['week']=$number; $protocol['treatment_time']=64; $initial[]=$protocol;
            $assessment->treatmentSessions()->create(['user_id'=>$user->id,'session_number'=>$number,'week'=>$number,
                'title'=>'Original session '.$number,'steps'=>$protocol['steps'],'treatment_time'=>64,
                'daily_home_care_routine'=>['morning'=>[['preserve'=>'original home care']]],'status'=>'completed',
                'post_images'=>[['id'=>$number,'custom_properties'=>['openai_file_id'=>'fixture-'.$number]]],
                'post_diagnosis'=>$case['context']['source_session']['post_diagnosis']]);
        }
        $original=json_encode(['treatment_plan'=>['course_outline'=>$case['course']['course_outline'],'treatments'=>$initial,
            'total_time'=>'Original total','modality_omission_explanation'=>[]], 'preserve_root_key'=>'original']);
        $path='treatment-plans/treatment_plans_#'.$assessment->id.'.json'; $disk->files[$path]=$original;
        return [$assessment, $assessment->treatmentSessions()->where('session_number',2)->first(), $case, $original, $path];
    }

    runContract('migration adds the nullable progress column', fn()=>check($db->schema()->hasColumn('assessments','facial_course_progress'),'Missing column'));
    runContract('saved reassessment admits exactly one owner; a second tab gets generating', function () use ($service) {
        [$a,$s]=seed(5); $first=$service->claim($s); $second=$service->claim($s);
        check($first['status']==='claimed' && $first['course_continuation']['session_numbers']===[3,4], 'Wrong first batch');
        check($second['status']==='generating' && !isset($second['token']), 'Duplicate ownership');
        check($a->treatmentSessions()->count()===2, 'Claim must not create treatments');
    });
    foreach ([5,6,7,8] as $total) {
        runContract('complete '.$total.'-session course with append-only pairs and correct final remainder', function () use ($service,$total,$disk) {
            [$a,$s,$case,$original,$path]=seed($total);
            $first=$a->treatmentSessions()->where('session_number',1)->first()->toArray();
            $oldSecond=$s->only(['id','steps','post_diagnosis','post_images','daily_home_care_routine','status']);
            for ($after=2; $after<$total; $after+=2) {
                $case=caseData($total,$after);
                $source=$a->treatmentSessions()->where('session_number',$after)->first();
                $source->update(['post_diagnosis'=>$case['context']['source_session']['post_diagnosis']]);
                $claim=$service->claim($source);
                check($claim['status']==='claimed','Next checkpoint not claimable');
                $result=$service->complete($source,$claim['token'],$case['generated'],$case['features']);
                check($result['status']==='ready','Batch not committed');
                $count=min($after+2,$total);
                check($a->treatmentSessions()->orderBy('session_number')->pluck('session_number')->all()===range(1,$count),'Wrong sequence/count');
                $same=$service->complete($source,$claim['token'],$case['generated'],$case['features']);
                check($same['status']==='ready' && $a->treatmentSessions()->count()===$count,'Lost response created duplicate rows');
                check($service->claim($source)['status']==='ready','Retry did not recognize committed batch');
                $service->syncLegacyPlan($a->id);
            }
            check($a->treatmentSessions()->where('session_number',1)->first()->toArray()===$first,'Session 1 was overwritten');
            check($s->fresh()->only(array_keys($oldSecond))===$oldSecond,'Session 2 clinical/history data was overwritten');
            check($a->treatmentSessions()->count()===$total && !$a->treatmentSessions()->where('session_number',$total+1)->exists(),'Course length changed');
            $last=$a->treatmentSessions()->where('session_number',$total)->first();
            check($service->inspect($last)['status']==='complete','Final course did not stop');
            $mirrored=json_decode($disk->files[$path],true);
            check(count($mirrored['treatment_plan']['treatments'])===$total && $mirrored['preserve_root_key']==='original','Legacy reader mirror lost data');
            check($disk->files[$path.'.before-continuation.json']===$original,'Original JSON backup was changed');
        });
    }
    runContract('stale reassessment or intake cannot commit generated treatments', function () use ($service) {
        foreach (['intake','reassessment','images'] as $changed) {
            [$a,$s,$case]=seed(6); $claim=$service->claim($s);
            if ($changed==='intake') $a->update(['age'=>36]);
            elseif ($changed==='images') $s->update(['post_images'=>[['id'=>987654]]]);
            else { $report=$s->post_diagnosis; $report['reassessment']['texture_open_pores_scoring']['base_post_score_or_label_internal']+=1; $s->update(['post_diagnosis'=>$report]); }
            $error=expectFailure(fn()=>$service->complete($s,$claim['token'],$case['generated'],$case['features']),'changed during generation');
            check($error->getCode()===409 && $a->treatmentSessions()->count()===2,'Stale plan was saved: '.$changed);
            $service->release($s,$claim['token'],'Retry after the checkpoint change');
            $new=$service->claim($s); check($new['token']!==$claim['token'],'Retry reused old ownership');
            expectFailure(fn()=>$service->complete($s,$claim['token'],$case['generated'],$case['features']),'no longer active');
        }
    });
    runContract('expired abandoned lease can be recovered and old owner cannot append', function () use ($service) {
        [$a,$s,$case]=seed(5); $old=$service->claim($s);
        $p=$a->fresh()->facial_course_progress; $p['batches']['2']['lease_until']=time()-1;
        $a->forceFill(['facial_course_progress'=>$p])->saveQuietly();
        $new=$service->claim($s); check($new['status']==='claimed' && $new['token']!==$old['token'],'Lease not recovered');
        expectFailure(fn()=>$service->complete($s,$old['token'],$case['generated'],$case['features']),'no longer active');
        $service->complete($s,$new['token'],$case['generated'],$case['features']);
        check($a->treatmentSessions()->count()===4,'Recovered batch failed');
    });
    runContract('invalid numbers, changed course length and partial existing batches are rejected', function () use ($service) {
        [$a,$s,$case]=seed(5); $claim=$service->claim($s); $bad=$case['generated'];
        $bad['treatment_plan']['treatments'][1]['session_number']=5;
        expectFailure(fn()=>$service->complete($s,$claim['token'],$bad,$case['features']));
        $bad=$case['generated']; array_pop($bad['treatment_plan']['course_outline']);
        expectFailure(fn()=>$service->complete($s,$claim['token'],$bad,$case['features']));
        check($a->treatmentSessions()->count()===2,'Invalid batch changed rows');
        $a->treatmentSessions()->create(['user_id'=>$a->user_id,'session_number'=>3]);
        expectFailure(fn()=>$service->claim($s),'Only part');
    });
    runContract('stray later sessions cannot bypass the course sequence', function () use ($service) {
        [$a,$s]=seed(5); $a->treatmentSessions()->create(['user_id'=>$a->user_id,'session_number'=>5]);
        expectFailure(fn()=>$service->claim($s),'out of sequence');
        check($a->treatmentSessions()->count()===3,'Unexpected session insertion');
    });
    runContract('database failure on the second insert rolls back the entire pair', function () use ($service,$db) {
        [$a,$s,$case]=seed(5); $claim=$service->claim($s);
        $db->getConnection()->statement('CREATE TRIGGER reject_pair_second BEFORE INSERT ON treatment_sessions WHEN NEW.assessment_id = '.$a->id.' AND NEW.session_number = 4 BEGIN SELECT RAISE(ABORT, "fixture second insert failure"); END');
        expectFailure(fn()=>$service->complete($s,$claim['token'],$case['generated'],$case['features']));
        check($a->treatmentSessions()->count()===2 && $s->fresh()->post_feature_packet===null,'Partial pair or feature update survived rollback');
        $db->getConnection()->statement('DROP TRIGGER reject_pair_second');
        $service->release($s,$claim['token'],'Retry database failure');
        $retry=$service->claim($s); $service->complete($s,$retry['token'],$case['generated'],$case['features']);
        check($a->treatmentSessions()->count()===4,'Retry after rollback failed');
    });
    runContract('JSON mirror failure cannot undo a committed pair and can be retried', function () use ($service,$disk,$log) {
        [$a,$s,$case,,$path]=seed(5); $claim=$service->claim($s);
        $service->complete($s,$claim['token'],$case['generated'],$case['features']);
        $disk->failWrites=true; $service->syncLegacyPlan($a->id); $disk->failWrites=false;
        check($a->treatmentSessions()->count()===4 && count($log->warnings)>0,'Mirror failure lost the DB commit');
        $service->syncLegacyPlan($a->id); check(count(json_decode($disk->files[$path],true)['treatment_plan']['treatments'])===4,'Mirror retry failed');
    });
    runContract('single/express, odd non-final sessions and unsaved checkpoints cannot trigger a new batch', function () use ($service) {
        foreach (['single','express'] as $type) { [, $s]=seed(5,$type); check($service->claim($s)['status']==='not_applicable','Wrong plan type admitted'); }
        [$a,$s]=seed(5); $s->update(['post_diagnosis'=>null]);
        check($service->claim($s)['status']==='awaiting_reassessment','Unsaved reassessment admitted');
        $odd=$a->treatmentSessions()->where('session_number',1)->first();
        check($service->claim($odd)['status']==='not_applicable','Odd checkpoint admitted');
    });
    runContract('controller saves the complete final session format, including checklist, concerns and every step field', function () use ($service, $container, $disk) {
        $container->instance(\Illuminate\Contracts\Routing\ResponseFactory::class, new class extends \Illuminate\Routing\ResponseFactory {
            public function __construct() {}
            public function json($data = [], $status = 200, array $headers = [], $options = 0) { return $data; }
        });
        [$a, $s, $case, , $path] = seed(5);
        $claim = $service->claim($s);
        $request = new class extends \Illuminate\Http\Request {
            public function validate(array $rules, ...$params) {
                return app('validator')->make($this->all(), $rules)->validate();
            }
        };
        $request->replace(['token' => $claim['token'], 'generated_plan' => $case['generated'], 'post_feature_packet' => $case['features']]);
        $controller = (new \ReflectionClass(\App\Http\Controllers\Api\TreatmentSessionController::class))->newInstanceWithoutConstructor();
        $response = $controller->completeCourseContinuation($request, $s, $service);
        check($response['results']['status'] === 'ready', 'Controller did not confirm saving');
        foreach ($case['generated']['treatment_plan']['treatments'] as $expected) {
            $saved = $a->treatmentSessions()->where('session_number', $expected['session_number'])->first();
            check($saved->steps === $expected['steps'], 'Controller dropped step names, instructions, equipment or metadata');
            check($saved->preparations_checklist_for_therapist === $expected['preparations_checklist_for_therapist'], 'Controller dropped preparation checklist');
            check($saved->concerns_addressed === $expected['concerns_addressed'], 'Controller dropped concerns');
            $progress = $a->fresh()->facial_course_progress;
            check($progress['plan']['treatments'][$expected['session_number'] - 1] === $expected, 'Progress lost session JSON fields');
        }
        $mirror = json_decode($disk->files[$path], true);
        check($mirror['treatment_plan']['treatments'][2] === $case['generated']['treatment_plan']['treatments'][0], 'Legacy plan lost final session format');
    });
    echo "Backend contracts passed: $passed\n";
}
