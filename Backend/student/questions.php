<?php
require_once __DIR__ . '/../config.php';

$studentId=requireLogin();
$stmt=$conn->prepare("SELECT role,grade,section FROM users WHERE id=? LIMIT 1"); $stmt->bind_param('i',$studentId); $stmt->execute(); $student=$stmt->get_result()->fetch_assoc(); $stmt->close();
if(!$student || $student['role']!=='student') jsonResponse(['success'=>false,'message'=>'Student access required.'],403);

if($_SERVER['REQUEST_METHOD']==='GET') {
    $stmt=$conn->prepare("SELECT ta.id AS assignment_id, ta.teacher_id, ta.subject, u.firstName, u.lastName, u.teacherId FROM teacher_assignments ta JOIN classes c ON c.id=ta.class_id JOIN users u ON u.id=ta.teacher_id WHERE TRIM(c.grade)=TRIM(?) AND UPPER(TRIM(c.section))=UPPER(TRIM(?)) ORDER BY u.firstName,u.lastName,ta.subject");
    $stmt->bind_param('ss',$student['grade'],$student['section']); $stmt->execute(); $res=$stmt->get_result(); $teacherMap=[];
    while($r=$res->fetch_assoc()) { $key=$r['teacher_id'].'|'.$r['subject']; $teacherMap[$key]=['assignmentId'=>(int)$r['assignment_id'],'teacherId'=>(int)$r['teacher_id'],'teacherName'=>trim($r['firstName'].' '.$r['lastName']),'teacherIdCode'=>$r['teacherId'],'subject'=>$r['subject']]; }
    $stmt->close();
    $teachers=array_values($teacherMap);
    $stmt=$conn->prepare("SELECT q.id,q.subject,q.question,q.response,q.status,q.created_at,q.responded_at,u.firstName,u.lastName,u.teacherId FROM teacher_questions q JOIN users u ON u.id=q.teacher_id WHERE q.student_id=? ORDER BY q.created_at DESC"); $stmt->bind_param('i',$studentId); $stmt->execute(); $res=$stmt->get_result(); $questions=[];
    while($r=$res->fetch_assoc()) $questions[]=['id'=>(int)$r['id'],'subject'=>$r['subject'],'question'=>$r['question'],'response'=>$r['response'],'status'=>$r['status'],'createdAt'=>$r['created_at'],'respondedAt'=>$r['responded_at'],'teacherName'=>trim($r['firstName'].' '.$r['lastName']),'teacherId'=>$r['teacherId']]; $stmt->close();
    jsonResponse(['success'=>true,'teachers'=>$teachers,'questions'=>$questions]);
}

requireMethod('POST'); $data=getJsonInput(); $assignmentId=(int)($data['teacher_assignment_id']??0); $question=trim((string)($data['question']??''));
if($assignmentId<=0 || $question==='') jsonResponse(['success'=>false,'message'=>'Choose a teacher and enter your question.'],400);
if(mb_strlen($question)>2000) jsonResponse(['success'=>false,'message'=>'Question is too long.'],400);
$stmt=$conn->prepare("SELECT ta.id,ta.teacher_id,ta.subject FROM teacher_assignments ta JOIN classes c ON c.id=ta.class_id WHERE ta.id=? AND TRIM(c.grade)=TRIM(?) AND UPPER(TRIM(c.section))=UPPER(TRIM(?)) LIMIT 1"); $stmt->bind_param('iss',$assignmentId,$student['grade'],$student['section']); $stmt->execute(); $assignment=$stmt->get_result()->fetch_assoc(); $stmt->close();
if(!$assignment) jsonResponse(['success'=>false,'message'=>'That teacher is not assigned to your class.'],403);
$stmt=$conn->prepare("INSERT INTO teacher_questions(student_id,teacher_id,teacher_assignment_id,subject,question) VALUES(?,?,?,?,?)"); $stmt->bind_param('iiiss',$studentId,$assignment['teacher_id'],$assignment['id'],$assignment['subject'],$question); $stmt->execute(); $id=$stmt->insert_id; $stmt->close();
jsonResponse(['success'=>true,'message'=>'Question sent to your teacher.','id'=>$id]);
