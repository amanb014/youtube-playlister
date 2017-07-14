import { Playlist } from './../Playlist';
import { api_key } from './../APIAuth';

require('angular').module('viewTube')
.controller('uiController', uiController);

function uiController($scope, shared) {

	loadPlaylists();

	//shows and hides the add button
	//first you toggle the add form, then if the check button is pressed,
	//add a new tab with provided URL and place the repository name.
	shared.btnAdd().addEventListener('click', () => {

		toggleAddForm();
		let checkButton:HTMLElement = document.getElementById('btn-check');

		if(shared.urlInput().innerHTML.trim() !== '') {
			checkButton.addEventListener('click', () => {
				let url:string = (<HTMLInputElement>document.getElementById('url-text')).value;
				if(url.startsWith(shared.prefix())) {
					addPlaylist(url.split('=')[1], 0);
				}
				//Not a valid url for playlist
				else {
					console.log('Please enter a valid playlist URL. For example: ' + shared.prefix() + '...');
				}
				toggleAddForm();
			});
		}
	});

	//Creates a new Playlist object based on the url in the form.
	//Pushes object to the array of all playlists currently tracking
	//Called on checkmark button press
	function addPlaylist(id, watchCount) {

		getPlaylistInfo(id).then(info => {
			let plist = new Playlist(info);
			plist.setWatchCount(watchCount);
			getVideos(id).then(videos => {
				plist.addVideos(videos);
				shared.playlists().push(plist);
				console.log(shared.playlists());
				shared.storage().savePlaylists(shared.playlists());
			});
		});
	}

	//Goes to the Google server (with HttpRequest) and retreives the playlist information
	function getPlaylistInfo(id:string) {
		let info;
		let location = 'https://www.googleapis.com/youtube/v3/playlists';
		let headers = {
			'id': id,
			'part':'snippet',
			'key': api_key,
		}

		return shared.request().getResponse(location, headers)
			.then(data => {
				console.log('quering google... (playlist)');
				return data;
			})
			.catch(error => {
				console.log(error);
			});
	}

	//Goes to the Google server (with HttpRequest) and retreives the videos inside a playlist id
	function getVideos(id:string) {
		let location = 'https://www.googleapis.com/youtube/v3/playlistItems';
		let headers = {
			'playlistId': id,
			'part':'snippet',
			'key': api_key
		}

		return shared.request().getResponse(location, headers)
			.then(data => {
				console.log('quering google... (video)');
				return data;
			})
			.catch(error => {
				console.log(error);
			});
	}

	//Method for displaying and removing the
	//Add New form
	function toggleAddForm() {
		let btnSpan:HTMLElement = document.getElementById('btn-url-span');
		btnSpan.classList.toggle('icon-plus-circled');
		btnSpan.classList.toggle('icon-minus-circled');

		let formElements:string = '<input id="url-text" style="width: 50%;" class="text-input" type="text" placeholder=" https://www.youtube.com/playlist?list=..."><button id="btn-check" class="btn btn-default"><span class="icon icon-check"></span></button>';
		shared.urlInput().innerHTML = shared.urlInput().innerHTML.trim() == '' ? formElements : '';
	}

	function toggleBackButton() {
		let backButton:HTMLElement = document.getElementById('btn-back');
		backButton.classList.toggle('hidden');
	}

	function loadPlaylists() {
		let data = shared.storage().getPlaylists()
			.then(data => {
				if(data['playlists']) {
					for(let i = 0; i < data['playlists'].length; i++) {
						addPlaylist(data['playlists'][i].id, data['playlists'][i].lastVideo);
					}
				}
			})
			.catch(error => {
				console.log(error);
			})
	}

}