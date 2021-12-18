<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Oggyp Chess</title>
    <?php include './resources/html/head.php'; ?>
</head>
<body>
<?php
include './resources/html/navbar.php'
?>
<div class="page">
    <h3>
        @INT Studios
    </h3>
    <br>
    <h1>
        <?php

        function get_operating_system() {
            $u_agent = $_SERVER['HTTP_USER_AGENT'];
            $operating_system = 'Unknown Operating System';

            //Get the operating_system name
            if (preg_match('/linux/i', $u_agent)) {
                $operating_system = 'Linux';
            } elseif (preg_match('/macintosh|mac os x|mac_powerpc/i', $u_agent)) {
                $operating_system = 'Mac';
            } elseif (preg_match('/windows|win32|win98|win95|win16/i', $u_agent)) {
                $operating_system = 'Windows';
            } elseif (preg_match('/ubuntu/i', $u_agent)) {
                $operating_system = 'Ubuntu';
            } elseif (preg_match('/iphone/i', $u_agent)) {
                $operating_system = 'IPhone';
            } elseif (preg_match('/ipod/i', $u_agent)) {
                $operating_system = 'IPod';
            } elseif (preg_match('/ipad/i', $u_agent)) {
                $operating_system = 'IPad';
            } elseif (preg_match('/android/i', $u_agent)) {
                $operating_system = 'Android';
            } elseif (preg_match('/blackberry/i', $u_agent)) {
                $operating_system = 'Blackberry';
            } elseif (preg_match('/webos/i', $u_agent)) {
                $operating_system = 'Mobile';
            }

            return $operating_system;
        }

        echo 'You are running: ';
        $os = get_operating_system();
        echo $os;
        echo '<br>';
        if ($os == 'Linux') {
            echo "This is the BEST OS!";
        } elseif ($os == 'Windows') {
            echo 'This is the WORST OS EVER TO EXIST';
        } else {
            echo "Use linux :gun:";
        }
        ?>
    </h1>
</div>
</body>
</html>
