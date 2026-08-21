<?php
require_once __DIR__ . '/../config.php';

$teacherId = requireLogin();

$stmt = $conn->prepare("SELECT role, firstName, lastName FROM users WHERE id=? LIMIT 1");
$stmt->bind_param('i', $teacherId);
$stmt->execute();
$teacher = $stmt->get_result()->fetch_assoc();
$stmt->close();
if (!$teacher || $teacher['role'] !== 'teacher') jsonResponse(['success'=>false,'message'=>'Teacher access required.'],403);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT q.id,q.subject,q.question,q.response,q.status,q.created_at,q.responded_at,u.id AS student_id,u.firstName,u.lastName,u.studentId,u.grade,u.section FROM teacher_questions q JOIN users u ON u.id=q.student_id WHERE q.teacher_id=? ORDER BY CASE WHEN q.status='pending' THEN 0 ELSE 1 END, q.created_at DESC");
    $stmt->bind_param('i',$teacherId); $stmt->execute(); $res=$stmt->get_result(); $questions=[];
    while($r=$res->fetch_assoc()) $questions[]=['id'=>(int)$r['id'],'subject'=>$r['subject'],'question'=>$r['question'],'response'=>$r['response'],'status'=>$r['status'],'createdAt'=>$r['created_at'],'respondedAt'=>$r['responded_at'],'student'=>['id'=>(int)$r['student_id'],'name'=>trim($r['firstName'].' '.$r['lastName']),'studentId'=>$r['studentId'],'grade'=>$r['grade'],'section'=>$r['section']]];
    $stmt->close();
    jsonResponse(['success'=>true,'questions'=>$questions]);
}

requireMethod('POST');
$data=getJsonInput();
$questionId=(int)($data['question_id']??0); $response=trim((string)($data['response']??''));
if($questionId<=0 || $response==='') jsonResponse(['success'=>false,'message'=>'A response is required.'],400);
if(mb_strlen($response)>4000) jsonResponse(['success'=>false,'message'=>'Response is too long.'],400);

$stmt=$conn->prepare("UPDATE teacher_questions SET response=?, status='answered', responded_at=CURRENT_TIMESTAMP WHERE id=? AND teacher_id=?");
$stmt->bind_param('sii',$response,$questionId,$teacherId);
$stmt->execute(); $changed=$stmt->affected_rows; $stmt->close();
if(!$changed) jsonResponse(['success'=>false,'message'=>'Question not found or already unavailable.'],404);
jsonResponse(['success'=>true,'message'=>'Response sent successfully.']);
