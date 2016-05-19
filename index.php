<?php
$version = apc_fetch('version');
$videos = apc_fetch('videos');
$volume = apc_fetch('volume');

if ($volume === false)
    $volume = 100;
    
if ($videos === false)
    $videos = array();

if (isset($_GET['video'])) {
    if (!in_array($_GET['video'], $videos)) {
        $videos[] = $_GET['video'];
        save();
    }
} else if (isset($_GET['version'])) {
    echo $version;
} else if (isset($_GET['update'])) {
    echo json_encode($videos);
} else if (isset($_GET['next'])) {
    echo array_shift($videos);
    save();
} else if (isset($_GET['clear'])) {
    $videos = [];
    save();
} else if (isset($_GET['remove']) && ($key = array_search($_GET['remove'], $videos)) !== false) {
    unset($videos[$key]);
    save();
} else if (isset($_GET['volumeup'])) {
    if ($volume  <= 95)
        $volume += 5;
    save();
} else if (isset($_GET['volumedown'])) {
    if ($volume >= 5)
        $volume -= 5; 
    save();
} else if (isset($_GET['volume'])) {
    echo $volume;
} else {
    include('ui.html');
}

function save() {
    global $version, $videos, $volume;
    $version += 1;
    apc_store('videos', $videos);
    apc_store('version', $version);
    apc_store('volume', $volume);
}
?>
