<?php
$version = apc_fetch('version');
$videos = apc_fetch('videos');
if (isset($_GET['video'])) {
    $video = $_GET['video'];
    if (!in_array($video, $videos)) {
        $videos[] = $video;
        $version += 1;
    }
    apc_store('videos', $videos);
    apc_store('version', $version);
} else if (isset($_GET['version'])) {
    echo $version;
} else if (isset($_GET['update'])) {
    echo json_encode($videos);
} else if (isset($_GET['next'])) {
    echo array_shift($videos);
    $version += 1;
    apc_store('videos', $videos);
    apc_store('version', $version);
} else if (isset($_GET['remove'])) {
    if(($key = array_search($_GET['remove'], $videos)) !== false) {
        unset($videos[$key]);
        $version += 1;
        apc_store('videos', $videos);
        apc_store('version', $version);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    include('ui.html');
}
?>
