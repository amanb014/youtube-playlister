const YouTubePlayer = require('youtube-player');
const player = YouTubePlayer('player');
const electron = require('electron');
let id;

window.addEventListener('popstate', handleUrlChange);
window.addEventListener('beforeunload', sendUpdateTime);

handleUrlChange(window.location.href);
function handleUrlChange(href) {
	const searchParams = getSearchParams(href);
	id = searchParams.videoId;
	player.loadVideoById(id, +searchParams.time);
	player.playVideo();
	player.getVideoUrl();

	setInterval(sendUpdateTime, 30000);
}

function getSearchParams() {
	const search = window.location.search.slice(1);
	const params = search.split('&');
	const obj = {};
	params.forEach(param => {
		const keyVal = param.split('=');
		obj[keyVal[0]] = keyVal[1];
	});
	return obj;
}

function sendUpdateTime() {
	player.getCurrentTime()
		.then(data => {
			electron.ipcRenderer.send('update-time', {time: data, videoId: id});
		})
}