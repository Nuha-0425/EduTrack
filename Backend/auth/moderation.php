<?php
require_once __DIR__ . '/../config.php';
$adminId = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $studentId = (int)($_GET['student_id'] ?? 0);
    if ($studentId <= 0) jsonResponse(['success'=>false,'message'=>'Student is required.'],400);
    $stmt=$conn->prepare("SELECT m.id,m.action_type,m.reason,m.created_at,a.firstName AS admin_first,a.lastName AS admin_last FROM moderation_actions m JOIN users a ON a.id=m.admin_id WHERE m.student_id=? ORDER BY m.created_at DESC");
    $stmt->bind_param('i',$studentId); $stmt->execute(); $res=$stmt->get_result(); $actions=[];
    while($r=$res->fetch_assoc()) $actions[]=['id'=>(int)$r['id'],'action'=>$r['action_type'],'reason'=>$r['reason'],'createdAt'=>$r['created_at'],'admin'=>trim($r['admin_first'].' '.$r['admin_last'])];
    $stmt->close();
    $stmt=$conn->prepare('SELECT id, reason, created_at FROM student_bans WHERE student_id=? LIMIT 1'); $stmt->bind_param('i',$studentId); $stmt->execute(); $ban=$stmt->get_result()->fetch_assoc(); $stmt->close();
    jsonResponse(['success'=>true,'actions'=>$actions,'banned'=>!!$ban,'ban'=>$ban]);
}

requireMethod('POST');
$data=getJsonInput(); $studentId=(int)($data['student_id']??0); $action=$data['action']??''; $reason=trim((string)($data['reason']??''));
if($studentId<=0 || !in_array($action,['warn','ban','unban'],true)) jsonResponse(['success'=>false,'message'=>'Invalid moderation action.'],400);
if($studentId===$adminId) jsonResponse(['success'=>false,'message'=>'Invalid student.'],400);
$check=$conn->prepare("SELECT id FROM users WHERE id=? AND role='student' LIMIT 1"); $check->bind_param('i',$studentId); $check->execute(); $exists=$check->get_result()->fetch_assoc(); $check->close(); if(!$exists) jsonResponse(['success'=>false,'message'=>'Student not found.'],404);

if($action==='warn') {
  $stmt=$conn->prepare("INSERT INTO moderation_actions(student_id,admin_id,action_type,reason) VALUES(?,?, 'warning', ?)"); $stmt->bind_param('iis',$studentId,$adminId,$reason); $stmt->execute(); $stmt->close(); jsonResponse(['success'=>true,'message'=>'Warning recorded.']);
}
if($action==='ban') {
  $stmt=$conn->prepare('INSERT INTO student_bans(student_id,admin_id,reason) VALUES(?,?,?) ON DUPLICATE KEY UPDATE admin_id=VALUES(admin_id), reason=VALUES(reason), created_at=CURRENT_TIMESTAMP'); $stmt->bind_param('iis',$studentId,$adminId,$reason); $stmt->execute(); $stmt->close();
  $stmt=$conn->prepare("INSERT INTO moderation_actions(student_id,admin_id,action_type,reason) VALUES(?,?, 'ban', ?)"); $stmt->bind_param('iis',$studentId,$adminId,$reason); $stmt->execute(); $stmt->close(); jsonResponse(['success'=>true,'message'=>'Student banned.']);
}
$stmt=$conn->prepare('DELETE FROM student_bans WHERE student_id=?'); $stmt->bind_param('i',$studentId); $stmt->execute(); $stmt->close();
$stmt=$conn->prepare("INSERT INTO moderation_actions(student_id,admin_id,action_type,reason) VALUES(?,?, 'unban', ?)"); $stmt->bind_param('iis',$studentId,$adminId,$reason); $stmt->execute(); $stmt->close(); jsonResponse(['success'=>true,'message'=>'Student unbanned.']);

function requireAdmin() {
    startAuthSession();
    $id=(int)($_SESSION['student_id']??0);
    if(!$id) jsonResponse(['success'=>false,'message'=>'You must be logged in.'],401);
    $stmt=$GLOBALS['conn']->prepare("SELECT role FROM users WHERE id=? LIMIT 1"); $stmt->bind_param('i',$id); $stmt->execute(); $u=$stmt->get_result()->fetch_assoc(); $stmt->close();
    if(!$u || $u['role']!=='admin') jsonResponse(['success'=>false,'message'=>'Admin access required.'],403);
    return $id;
}
