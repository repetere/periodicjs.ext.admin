'use strict';

var request = require('superagent'),
	updatemedia = require('./updatemedia'),
	themeModal,
	searchThemeInput,
	searchThemeButton,
	searchGithubResultsTable,
	searchGithubResultsTableBody,
	installedtable,
	installedtablebody,
	uploadButton,
	hideConsoleOutput,
	consoleOutput,
	tabelement,
	componentTab1,
	ComponentTabs = require('periodicjs.component.tabs');

window.addEventListener('load', function (e) {
	tabelement = document.getElementById('tabs');
	if (tabelement) {
		componentTab1 = new ComponentTabs(tabelement);
	}
	searchThemeInput = document.getElementById('search-theme_input');
	searchThemeButton = document.getElementById('search-theme_button');
	searchGithubResultsTable = document.getElementById('theme-search-results');
	searchGithubResultsTableBody = document.getElementById('theme-search-results-tbody');
	themeModal = document.getElementById('view-theme-info-modal');
	consoleOutput = document.getElementById('theme-console-output');
	installedtablebody = document.getElementById('installed-theme-tablebody');
	installedtable = document.getElementById('installed-theme-table');
	hideConsoleOutput = document.getElementById('hide-theme-console');
	uploadButton = document.getElementById('upload-theme_button');
	searchThemeInput.addEventListener('keypress', searchInputKeypress, false);
	searchThemeButton.addEventListener('click', searchThemeFromGithub, false);
	searchGithubResultsTable.addEventListener('click', searchTblClick, false);
	themeModal.addEventListener('click', thememodalClick, false);
	installedtable.addEventListener('click', installedTableClick, false);
	hideConsoleOutput.addEventListener('click', hideConsoleOutputClick, false);
	uploadButton.addEventListener('change', uploadMediaFiles, false);
	window.themespagetabs = componentTab1;
});

window.deletedThemeCallback = function (deletedata) {
	window.ribbonNotification.showRibbon('deleted', 4000, 'warn');
	document.getElementById('theme-console').style.display = 'block';
	deletedata.data = deletedata;
	getConsoleOutput(deletedata, deletedata.repo, deletedata.themename, 'remove');
	console.log(deletedata);
};

window.backToThemeLanding = function () {
	window.location = '/p-admin/themes';
};

var uploadMediaFiles = function (e) {
	// fetch FileList object
	var files = e.target.files || e.dataTransfer.files;

	// process all File objects
	for (var i = 0, f; f = files[i]; i++) {
		// ParseFile(f);
		// uploadFile(f);
		updatemedia.uploadFile(null, f, {
			posturl: '/p-admin/theme/upload?format=json',
			callback: function (doc) {
				// console.log(doc);
				var res = {
					body: {
						data: {
							time: doc.time,
							repo: doc.themename
						}
					}
				};
				document.getElementById('theme-console').style.display = 'block';
				getConsoleOutput(res.body, null, null, null, {
					getRequest: '/p-admin/theme/upload/log/' + doc.themename + '/' + doc.time,
					themename: doc.themename,
					time: doc.time
				});
			}
		});
	}
};

var hideConsoleOutputClick = function (e) {
	document.getElementById('theme-console').style.display = 'none';
};

var installedTableClick = function (e) {
	var eTarget = e.target;

	if (eTarget.getAttribute('class') && eTarget.getAttribute('class').match('enable-theme-button')) {
		// window.ribbonNotification.showRibbon( 'switching',4000,'default');
		request
			.get(eTarget.getAttribute('data-href'))
			.query({
				format: 'json'
			})
			.set('Accept', 'application/json')
			.end(function (error, res) {
				if (error) {
					window.ribbonNotification.showRibbon(error.message, 4000, 'error');
				}
				else if (res.body.result === 'success') {
					if (res.body.data.msg === 'theme disabled') {
						window.ribbonNotification.showRibbon(res.body.data.msg, 4000, 'warn');
						eTarget.innerHTML = 'enable';
						eTarget.setAttribute('data-href', '/p-admin/theme/' + res.body.data.ext + '/enable');
						eTarget.setAttribute('class', '_pea-button  enable-theme-button');
						//<a data-href='/p-admin/theme/<%= theme.name %>/enable' class='_pea-button enable-theme-button'>enable</a>		
					}
					else {
						window.ribbonNotification.showRibbon(res.body.data.msg, 4000, 'success');
						var themeButtons = document.querySelectorAll('.switch-theme-button');
						for (var x in themeButtons) {
							if (typeof themeButtons[x] === 'object') {
								themeButtons[x].setAttribute('class', '_pea-button switch-theme-button enable-theme-button');
								themeButtons[x].innerHTML = 'switch';
							}
						}
						eTarget.innerHTML = 'active';
						eTarget.setAttribute('class', '_pea-button switch-theme-button _pea-color-info');
						//<a data-href='/p-admin/theme/<%= theme.name %>/disable' class='_pea-button _pea-color-warn enable-theme-button'>disable</a>				
					}
				}
				else {
					window.ribbonNotification.showRibbon(res.body.data.error, 4000, 'error');
				}
			});
	}
	else if (eTarget.getAttribute('class') && eTarget.getAttribute('class').match('delete-theme-button')) {
		// window.ribbonNotification.showRibbon( 'deleting',1000,'default');
		request
			.post(eTarget.getAttribute('data-href'))
			.query({
				format: 'json',
				_csrf: eTarget.getAttribute('data-token')
			})
			.set('Accept', 'application/json')
			.end(function (error, res) {
				if (res && res.error) {
					error = res.error;
				}
				if (error) {
					window.ribbonNotification.showRibbon(error.message, 4000, 'error');
				}
				else if (res.body.result === 'error') {
					window.ribbonNotification.showRibbon(res.body.data.error, 4000, 'error');
				}
				else {
					document.getElementById('theme-console').style.display = 'block';
					getConsoleOutput(res.body, eTarget.getAttribute('data-themename'), res.body.data.themename, 'remove');
				}
			});

	}
};

var searchThemeFromGithub = function () {
	searchGithubResultsTableBody.innerHTML = '<tr><td class="_pea-text-center" colspan="3">searching github</td></tr>';

	request
		.get('https://api.github.com/search/repositories')
		.query({
			q: 'periodicjs.theme.' + document.getElementById('search-theme_input').value
		})
		.set('Accept', 'application/json')
		.end(function (error, res) {
			if (error) {
				window.ribbonNotification.showRibbon(error.message, 4000, 'error');
			}
			else if (!res.body.items) {
				window.ribbonNotification.showRibbon('could not search github', 4000, 'error');
			}
			else {
				searchGithubResultsTable.style.display = 'table';
				searchGithubResultsTableBody.innerHTML = buildSearchThemeResultTable(res.body.items);
			}
		});
};

var searchInputKeypress = function (e) {
	if (e.which === 13 || e.keyCode === 13) {
		searchThemeFromGithub();
	}
};

var buildSearchThemeResultTable = function (data) {
	var returnhtml = '',
		repoinfo;
	for (var x in data) {
		repoinfo = data[x];
		returnhtml += '<tr><td>' + repoinfo.name + '</td><td>' + repoinfo.description + '</br> <small><a target="_blank" href="' + repoinfo.html_url + '">' + repoinfo.html_url + '</a></small></td><td class="_pea-text-right">';
		returnhtml += '<a href="#view/' + repoinfo.full_name + '" class="view-theme _pea-button" data-gitname="' + repoinfo.full_name + '" data-exttitle="' + repoinfo.name + '" data-desc="' + repoinfo.description + '">install</a></td></tr>';
	}
	return returnhtml;
};

var searchTblClick = function (e) {
	var eTarget = e.target,
		fullreponame,
		repoversionlist;

	// console.log("search table click");

	if (eTarget.getAttribute('class') && eTarget.getAttribute('class').match('view-theme')) {
		themeModal.querySelector('.title').innerHTML = eTarget.getAttribute('data-exttitle').replace('periodicjs.theme.', '');
		themeModal.querySelector('.desc').innerHTML = eTarget.getAttribute('data-desc');
		repoversionlist = themeModal.querySelector('.versions');
		repoversionlist.innerHTML = '<li>loading versions...</li>';
		fullreponame = eTarget.getAttribute('data-gitname');

		// console.log('themeModal',themeModal);
		window.silkscreenModal.showSilkscreen('Install Theme', themeModal, null, 14);

		request
			.get('https://api.github.com/repos/' + fullreponame + '/tags')
			.set('Accept', 'application/json')
			.end(function (error, res) {
				if (error) {
					window.ribbonNotification.showRibbon(error.message, 4000, 'error');
				}
				else {
					themeModal.querySelector('.versions').innerHTML = '';
					repoversionlist.innerHTML = '<li><a class="install-theme-link" data-repo="' + fullreponame + '" data-version="latest">latest</a></li>';
					// console.log(res.body.length,res.body)
					if (res.body.length > 0) {
						for (var x in res.body) {
							repoversionlist.innerHTML += '<li><a class="install-theme-link" data-repo="' + fullreponame + '" data-version="' + res.body[x].name + '">' + res.body[x].name + '</a></li>';
						}
					}
				}
			});
	}
};

var thememodalClick = function (e) {
	var eTarget = e.target;
	if (eTarget.getAttribute('class') === 'install-theme-link') {
		window.silkscreenModal.hideSilkscreen();

		request
			.get('/p-admin/theme/install')
			.query({
				name: eTarget.getAttribute('data-repo'),
				version: eTarget.getAttribute('data-version'),
				format: 'json'
			})
			.set('Accept', 'application/json')
			.end(function (error, res) {
				if (res && res.error) {
					error = res.error;
				}
				if (error) {
					window.ribbonNotification.showRibbon(error.message, 4000, 'error');
				}
				else {
					document.getElementById('theme-console').style.display = 'block';
					getConsoleOutput(res.body, eTarget.getAttribute('data-repo').split('/')[1]);
				}
			});
	}
};

var getConsoleOutput = function (responsebody, fullrepo, extname, operation, options) {
	var t = setInterval(function () {
			getOutputFromFile(responsebody.data.repo, responsebody.data.time, options);
		}, 4000),
		otf,
		cnt = 0,
		lastres = '',
		getRequest,
		repo = responsebody.data.repo,
		time = responsebody.data.time;
	if (options && options.getRequest) {
		getRequest = options.getRequest;
		fullrepo = options.repo;
		repo = options.repo;
		time = options.time;
	}
	else {
		getRequest = (operation === 'remove') ? '/p-admin/theme/remove/log/' + repo + '/' + time : '/p-admin/theme/install/log/' + repo + '/' + time;
	}
	consoleOutput.innerHTML = '<pre>loading..</pre>';

	var getOutputFromFile = function (repo, time, options) {
		request
			.get(getRequest)
			.set('Accept', ' text/plain')
			.end(function (error, res) {
				if (res.error) {
					error = res.error;
				}

				if (error) {
					window.ribbonNotification.showRibbon(error.message || res.text, 8000, 'error');
					// console.log('error in ajax for file log data');
					clearTimeout(t);
				}
				else {
					if (cnt > 20) {
						console.log('made 20 req stop ajax');
						clearTimeout(t);
					}
					// console.log(cnt);
					// console.log(res.text);
					if (res.text !== lastres) {
						otf = document.createElement('pre');
						otf.innerHTML = res.text;
						consoleOutput.appendChild(otf);
						consoleOutput.scrollTop = consoleOutput.scrollHeight;
					}
					if (res.text.match('====!!ERROR!!====') || res.text.match('====##END##====')) {
						if (res.text.match('====##END##====')) {
							window.ribbonNotification.showRibbon(fullrepo + ' installed', 8000, 'success');
							if (!installedtable.innerHTML.match(fullrepo)) {
								var installedTheme = document.createElement('tr');
								installedTheme.innerHTML = '<td><a href="/p-admin/theme/' + fullrepo + '">' + fullrepo + '</a><div><small>Refresh page for updated UI</small</div></td>' + '<td></td>' + '<td class="_pea-text-right"><a data-themename="' + fullrepo + '" data-href="/p-admin/theme/' + fullrepo + '/enable" class="_pea-button switch-theme-button enable-theme-button">switch</a>' + '</td>';
								installedtablebody.appendChild(installedTheme);
							}
							else {
								console.log('already installed', repo, time);
							}
							cleanupLogFile(repo, time, 'install', options);
						}
						clearTimeout(t);
					}
					else if (res.text.match('====!!ERROR!!====') || res.text.match('====##REMOVED-END##====')) {

						window.ribbonNotification.showRibbon(fullrepo + ' removed', 4000, 'warn');
						var removeThemeElement = document.getElementById('tr-theme-' + extname);
						removeThemeElement.parentNode.removeChild(removeThemeElement);
						cleanupLogFile(repo, time, 'remove');
						clearTimeout(t);
					}
					lastres = res.text;
					cnt++;
				}
			});
	};

	var cleanupLogFile = function (repo, time, mode, options) {
		var makenice = (options) ? true : false;
		request
			.get('/p-admin/theme/cleanup/log/' + repo + '/' + time)
			.query({
				format: 'json',
				mode: mode,
				makenice: makenice
			})
			.set('Accept', ' application/json')
			.end(function (error, res) {
				if (res.error) {
					error = res.error;
				}

				if (error) {
					window.ribbonNotification.showRibbon(error.message || res.text, 8000, 'error');
				}
			});
	};
};
