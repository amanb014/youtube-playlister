import { Playlist } from './../Playlist';
import { api_key } from './../APIAuth';
import {ipcRenderer} from 'electron';
const fs = require('fs');

require('angular').module('viewTube')
.controller('uiController', uiController);

function uiController($scope, shared) {

	var checkButton = document.getElementById('btn-check');
	var urlTextBox = <HTMLInputElement>document.getElementById('url-text');

	document.addEventListener('drop', function(e) {
	  e.preventDefault();
	  e.stopPropagation();
	});
	document.addEventListener('dragover', function(e) {
	  e.preventDefault();
	  e.stopPropagation();
	});

	loadConfig();
	loadPlaylists();

	//shows and hides the add button
	//first you toggle the add form, then if the check button is pressed,
	//add a new tab with provided URL and place the repository name.
	shared.btnAdd().addEventListener('click', () => {
		toggleAddForm();
		urlTextBox.focus();

		urlTextBox.addEventListener("keyup", function(event) {
		    event.preventDefault();
		    if (event.keyCode == 13) {
		        addFromForm();
		    }
		});

	});

	checkButton.addEventListener('click', addFromForm);

	function addFromForm() {
		let url:string = urlTextBox.value;
		if(url.startsWith(shared.prefix())) {
			//when adding a new playlist from the form,
			//no need to set any parameters for current/last video.
			let watched = [];
			addPlaylist(url.split('=')[1], -1, '', -1, shared.config().sequential);
			toggleAddForm();
		}
		//Not a valid url for playlist
		else {
			console.log(shared.prefix());
			alert('Please check URL matches format. Example: ' + shared.prefix() + '...');
		}

		(<HTMLFormElement>document.getElementById('addVideoForm')).reset();
	}

	//Creates a new Playlist object based on the url in the form.
	//Pushes object to the array of all playlists currently tracking
	//Called on checkmark button press
	function addPlaylist(id, last, watchingId, watchingTime, seq, 
		//optional parameters
		watchedArr = [], partialArr = []) {

		return new Promise((resolve, reject) => {
			getPlaylistInfo(id)
				.then(info => {
					let plist = new Playlist(info);
					plist.sequential = seq;
					plist.lastCompleted = last;
					plist.watchingId = watchingId;
					plist.watchingTime = watchingTime;
					plist.watched = watchedArr;
					plist.partial = partialArr

					let temp = shared.getPlaylists();
					temp.push(plist);

					shared.setPlaylists(temp)
						//setPlaylists returns a boolean if saved
						.then(saved => {
							if(saved){ resolve(temp.length); }
						})
						.catch(error => {
							reject(confirm('Click OK to view current issues on GitHub. Error: ' + error));
						});
			});
		});

		//used to add playlist from ANYWHERE.

	}

	//Goes to the Google server (with HttpRequest) and retreives the playlist information
	function getPlaylistInfo(id:string) {
		let info;
		let location = 'https://www.googleapis.com/youtube/v3/playlists';
		let headers = {
			'id': id,
			'part':'snippet,contentDetails',
			'key': api_key,
		}

		return shared.request().getResponse(location, headers)
			.then(data => {
				return data;
			})
			.catch(error => {
				confirm('Click OK to view current issues on GitHub. Error: ' + error);
			});
	}

	//Method for displaying and removing the
	//Add New form
	function toggleAddForm() {
		let btnSpan:HTMLElement = document.getElementById('btn-url-span');
		btnSpan.classList.toggle('icon-plus-circled');
		btnSpan.classList.toggle('icon-minus-circled');

		shared.urlCont().classList.toggle('hidden');
	}

	//this method is for loading ALL playlists from the storage file.
	//can also be used in the future for loading playlists from a backup.
	function loadPlaylists() {

		//if nothing was passed in here, load from the storage
		//if there is nothing in storage, a new storage file is created next time.
		shared.storage().get('playlists')
				.then(data => {
					let sorted = false;
					if(data['playlists']) {
						for(let i = 0; i < data['playlists'].length; i++) {

							//adding playlists fro the storage
							//sets all parameters in the currently adding playlist.
							//go see addPlaylist() definition above.
							addPlaylist(
								data['playlists'][i].id,
								data['playlists'][i].lastCompleted,
								data['playlists'][i].watchingId,
								data['playlists'][i].watchingTime,
								data['playlists'][i].sequential,
								data['playlists'][i].watched,
								data['playlists'][i].partial)
							.then(count => {
								//all playlists were added. Sort them.
								console.log(count);
								if(count === data['playlists'].length) {
									sortPlaylists();
								}
							})
						}
					}
				})
				.catch(error => {
					confirm('Click OK to view current issues on GitHub. Error: ' + error);
				});
		}

	function sortPlaylists() {
		let temp = shared.getPlaylists();
		temp.sort(comparePlaylists);
		shared.setPlaylists(temp);
		console.log('sorting playlists');
	}

	function comparePlaylists(a, b) {
		var a = (shared.config().sortPlaylistsByName === 'channel') ? a.channelName.toUpperCase() : a.title.toUpperCase();
		var b = (shared.config().sortPlaylistsByName === 'channel ') ? b.channelName.toUpperCase() : b.title.toUpperCase();
		
		console.log('comparing ' + a + ' to ' + b);

		if(a < b) { return -1; }
		if(a > b) { return  1; }
		
		return 0;
	}

	function loadConfig() {
		let config;
		shared.storage().get('config').then(data => {
			if(isEmpty(data)) {
				console.log('LOADING DEFAULT CONFIG');
				config = {
					'theme':'light', 					// light | dark
					'autoplay':false,
					'iFrame':true,
					'restart':false,
					'alwaysOnTop':false,
					'sequential': true,
					'threshhold': 0.90,					// 0.5 - 0.95
					'sortPlaylistsByName':'playlist', 	// playlist | channel
					'markPrevious': true,
					'markNext': true,
					'skipWatched': false,
					'warnBeforeDelete': true,
					'afterNonsequentialFinishes': 'next' 		// next | random | close
				}
			} else {
				config = data;
			}
			console.log('sending event alwaysontop... ' + config.alwaysontop);
			ipcRenderer.send('always-on-top', config.alwaysontop);
			shared.setConfig(config);
		});
	}

	function isEmpty(obj){
		return Object.keys(obj).length === 0;
	}

	ipcRenderer.on('sort-playlists', (event, obj) => {
		sortPlaylists();
	});

}