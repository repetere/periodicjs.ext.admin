'use strict';

var formobj = require('./formtoobject'),
	request = require('superagent'),
	ribbon = require('ribbonjs'),
	classie = require('classie'),
	silkscreen = require('silkscreenjs'),
	updatemedia = require('./updatemedia'),
	mediafilessearchresult,
	mediasearchresultarray,
	mediafilesresult,
	confirmDeleteYes,
	mediaSearchButton;

var preventSubmitOnEnter = function (e) {
	// console.log('key press');
	if (e.which === 13 || e.keyCode === 13) {
		// console.log(e);
		// console.log('prevent submit');
		e.preventDefault();
		return false;
	}
};

var preventEnterSubmitListeners = function () {
	var noSubmitElements = document.querySelectorAll('.noFormSubmit');
	// console.log(noSubmitElements);
	for (var x in noSubmitElements) {
		if (typeof noSubmitElements[x] === 'object') {
			noSubmitElements[x].addEventListener('keypress', preventSubmitOnEnter, false);
			noSubmitElements[x].addEventListener('keydown', preventSubmitOnEnter, false);
		}
	}
	// document.addEventListener('keypress', preventSubmitOnEnter, false);
};

var ajaxFormSubmit = function (e, element) {
	// console.log('e', e);
	var f = (element) ? element : e.target;
	if (f.getAttribute('data-beforesubmitfunction')) {
		var beforesubmitFunctionString = f.getAttribute('data-beforesubmitfunction'),
			beforefn = window[beforesubmitFunctionString];
		// is object a function?
		if (typeof beforefn === 'function') {
			beforefn(e);
		}
	}
	var formData = new formobj(f);

	request
		.post(f.action)
		.set('x-csrf-token', document.querySelector('input[name=_csrf]').value)
		.set('Accept', 'application/json')
		.query({
			format: 'json'
		})
		.send(formData)
		.end(function (error, res) {
			// console.log('error', error);
			// console.log('res', res);
			var errorfn;
			if (f.getAttribute('data-errorfunction')) {
				var errorFunctionString = f.getAttribute('data-errorfunction');
				errorfn = window[errorFunctionString];
			}


			if (res && res.body && res.body.result === 'error') {
				window.ribbonNotification.showRibbon(res.body.data.error, 4000, 'error');
				if (typeof errorfn === 'function') {
					errorfn(res.body.data.error);
				}
			}
			else if (res && res.clientError) {
				window.ribbonNotification.showRibbon(res.status + ': ' + res.text, 4000, 'error');
				if (typeof errorfn === 'function') {
					errorfn(res.status + ': ' + res.text);
				}
			}
			else if (error) {
				window.ribbonNotification.showRibbon(error.message, 4000, 'error');
				if (typeof errorfn === 'function') {
					errorfn(error.message);
				}

			}
			else {
				window.ribbonNotification.showRibbon('saved', 4000, 'success');
				if (f.getAttribute('data-successfunction')) {
					var successFunctionString = f.getAttribute('data-successfunction'),
						successfn = window[successFunctionString];
					// is object a function?
					if (typeof successfn === 'function') {
						successfn(res.body.data);
					}
				}
			}
		});
	if (e) {
		e.preventDefault();
	}
};

window.ajaxFormSubmit = ajaxFormSubmit;

var autoSubmitFormOnChange = function () {
	var formElement = this.form;
	if (classie.hasClass(formElement, '_pea-ajax-form')) {
		ajaxFormSubmit(null, formElement);
	}
	else {
		formElement.submit();
	}
	// console.log('this.form', this.form);
};

var submitOnChangeListeners = function () {
	var autoSubmitElements = document.querySelectorAll('.autoFormSubmit');
	for (var x in autoSubmitElements) {
		if (typeof autoSubmitElements[x] === 'object') {
			autoSubmitElements[x].addEventListener('change', autoSubmitFormOnChange, false);
		}
	}
};


var deleteContentSubmit = function (e) {
	var eTarget = e.target,
		posturl = eTarget.getAttribute('data-href');

	request
		.post(posturl)
		.set('x-csrf-token', document.querySelector('input[name=_csrf]').value)
		.set('Accept', 'application/json')
		.query({
			format: 'json'
		})
		.end(function (error, res) {
			if (res && res.body && res.body.result === 'error') {
				window.ribbonNotification.showRibbon(res.body.data.error, 4000, 'error');
			}
			else if (res && res.clientError) {
				window.ribbonNotification.showRibbon(res.status + ': ' + res.text, 4000, 'error');
			}
			else if (error) {
				window.ribbonNotification.showRibbon(error.message, 4000, 'error');
			}
			else {
				if (!eTarget.getAttribute('data-donotnotify')) {
					window.ribbonNotification.showRibbon('deleted', 4000, 'warn');
				}

				if (eTarget.getAttribute('data-successfunction')) {
					var successFunctionString = eTarget.getAttribute('data-successfunction'),
						successfn = window[successFunctionString];
					// is object a function?
					if (typeof successfn === 'function') {
						successfn(res.body.data);
					}
				}
			}
		});
};

var confirmDeleteDialog = function (e) {
	var eTarget = e.target,
		posturl = eTarget.getAttribute('data-href'),
		successfunction = eTarget.getAttribute('data-successfunction'),
		donotnotify = eTarget.getAttribute('data-donotnotify');
	confirmDeleteYes.setAttribute('data-href', '#');
	confirmDeleteYes.setAttribute('data-href', posturl);
	confirmDeleteYes.setAttribute('data-successfunction', successfunction);
	confirmDeleteYes.setAttribute('data-donotnotify', donotnotify);
	window.silkscreenModal.showSilkscreen('Confirmation Warning', document.getElementById('modal-confirm-delete'), 'default');
};

var ajaxDeleteButtonListeners = function () {
	var deleteButtons = document.querySelectorAll('._pea-dialog-delete');
	if (confirmDeleteYes) {
		confirmDeleteYes.addEventListener('click', deleteContentSubmit, false);
	}
	for (var x in deleteButtons) {
		if (typeof deleteButtons[x] === 'object') {
			deleteButtons[x].addEventListener('click', confirmDeleteDialog, false);
		}
	}
};

window.ajaxDeleteButtonListeners = ajaxDeleteButtonListeners;

var addMediaItem = function (e) {
	var eTarget = e.target,
		mediaitemid = eTarget.getAttribute('data-id'),
		clickedMediaItem;

	for (var x in mediasearchresultarray) {
		if (mediasearchresultarray[x]._id === mediaitemid) {
			clickedMediaItem = mediasearchresultarray[x];
		}
	}
	mediafilessearchresult.innerHTML = '';
	classie.addClass(mediafilessearchresult, '_pea-hidden');
	updatemedia(mediafilesresult, clickedMediaItem);

	if (window.ajaxFormToSubmit) {
		window.ajaxFormSubmit(null, window.ajaxFormToSubmit);
	}
};

var addMediaListeners = function () {
	var addMediaButtons = document.querySelectorAll('.add-asset-item');
	for (var x in addMediaButtons) {
		if (typeof addMediaButtons[x] === 'object') {
			addMediaButtons[x].addEventListener('click', addMediaItem, false);
		}
	}
};

var searchMedia = function (e) {
	var eTarget = e.target,
		posturl = eTarget.getAttribute('data-href');

	request
		.get(posturl)
		.set('x-csrf-token', document.querySelector('input[name=_csrf]').value)
		.set('Accept', 'application/json')
		.query({
			search: document.querySelector('input[name=media-search-query]').value,
			format: 'json'
		})
		.end(function (error, res) {
			if (res && res.body && res.body.result === 'error') {
				window.ribbonNotification.showRibbon(res.body.data.error, 4000, 'error');
			}
			else if (res && res.clientError) {
				window.ribbonNotification.showRibbon(res.status + ': ' + res.text, 4000, 'error');
			}
			else if (error) {
				window.ribbonNotification.showRibbon(error.message, 4000, 'error');
			}
			else {
				if (eTarget.getAttribute('data-successfunction')) {
					var successFunctionString = eTarget.getAttribute('data-successfunction'),
						successfn = window[successFunctionString];
					// is object a function?
					if (typeof successfn === 'function') {
						mediasearchresultarray = res.body.assets;
						successfn(mediasearchresultarray);
					}
				}
			}
		});
};

var cloneContentListener = function () {
	var clonebutton = document.getElementById('clone-item-button');
	if (clonebutton) {
		clonebutton.addEventListener('click', function () {
			var doctypename = document.querySelector('input[name=doctypename]').value;
			var editform = document.getElementById('edit-' + doctypename + '-form');
			editform.setAttribute('action', '/' + doctypename + '/new');
			editform.querySelector('input[name=name]').value = '';
			editform.querySelector('input[name=title]').value = editform.querySelector('input[name=title]').value + ' 2';
			editform.setAttribute('data-successfunction', 'cloneContentView');
			ajaxFormSubmit(null, editform);
			// editform.submit();
		}, false);
	}
};

window.cloneContentView = function (data) {
	var doctypename = document.querySelector('input[name=doctypename]').value;
	window.location.href = '/p-admin/' + doctypename + '/edit/' + data.doc._id;
	// console.log('cloneContentView cloneContentView', );
};

window.mediaSearchResult = function (searchData) {
	classie.removeClass(mediafilessearchresult, '_pea-hidden');
	mediafilessearchresult.innerHTML = '';
	if (searchData && searchData.length > 0) {
		mediafilessearchresult.innerHTML = '<h3 class="no-margin">' + searchData.length + ' Results</h3>';
		for (var x in searchData) {
			updatemedia(mediafilessearchresult, searchData[x], true);
		}
		addMediaListeners();

	}
	else {
		mediafilessearchresult.innerHTML = '<div class="_pea-text-center">No Media Found</div>';
	}
};

window.updateContentTypes = function (AjaxDataResponse) {
	var contenttypeContainer = document.getElementById('doc-ct-attr'),
		updatedDoc = AjaxDataResponse.doc,
		contentTypeHtml = '',
		trackchangesmessageContainer = document.getElementById('latest_content_revision');

	if (trackchangesmessageContainer) {
		trackchangesmessageContainer.style.display = 'block';
	}


	for (var x in updatedDoc.contenttypes) {
		var contentTypeData = updatedDoc.contenttypes[x];
		contentTypeHtml += '<div>';
		contentTypeHtml += '<h3 style="margin:0.25em 0 0;">' + contentTypeData.title + '<small> <a href="/p-admin/contenttype/' + contentTypeData.name + '">(edit)</a></small></h3>';
		if (contentTypeData.attributes) {
			for (var y in contentTypeData.attributes) {
				var attr = contentTypeData.attributes[y],
					defaultVal = attr.defaultvalue || '';
				if (updatedDoc.contenttypeattributes && updatedDoc.contenttypeattributes[contentTypeData.name] && updatedDoc.contenttypeattributes[contentTypeData.name][attr.name]) {
					defaultVal = updatedDoc.contenttypeattributes[contentTypeData.name][attr.name];
				}
				contentTypeHtml += '<div class="_pea-row _pea-container-forminput">';
				contentTypeHtml += '<label class="_pea-label _pea-col-span3"> ' + attr.title + ' </label>';
				if (attr.datatype === 'array' && attr.defaultvalue) {
					var selectOptionsFromDefaultVal = attr.defaultvalue.split(',');
					contentTypeHtml += '<select class="_pea-col-span9 noFormSubmit" name="contenttypeattributes.' + contentTypeData.name + '.' + attr.name + '">';
					for (var j in selectOptionsFromDefaultVal) {
						contentTypeHtml += '<option ';
						if (selectOptionsFromDefaultVal[j] === defaultVal) {
							contentTypeHtml += 'selected="selected"';
						}
						contentTypeHtml += ' value="' + selectOptionsFromDefaultVal[j] + '">' + selectOptionsFromDefaultVal[j] + '</option>';
					}
					contentTypeHtml += '</select>';
				}
				else {
					contentTypeHtml += '<input class="_pea-col-span9 noFormSubmit" type="text" placeholder="' + attr.title + '" value="' + defaultVal + '" name="contenttypeattributes.' + contentTypeData.name + '.' + attr.name + '">';
				}
				contentTypeHtml += '</div>';
			}
		}
		contentTypeHtml += '</div>';
	}
	contenttypeContainer.innerHTML = contentTypeHtml;
};

//'._pea-ajax-form' http://www.sitepoint.com/easier-ajax-html5-formdata-interface/
window.ajaxFormEventListers = function (selector) {
	var ajaxforms = document.querySelectorAll(selector);
	for (var x in ajaxforms) {
		if (typeof ajaxforms[x] === 'object') {
			// console.log(new FormData(ajaxforms[x]));
			ajaxforms[x].addEventListener('submit', ajaxFormSubmit, false);
		}
	}
};

window.makeNiceName = function (username) {
	if (username) {
		return username.replace(/[^a-z0-9]/gi, '-').toLowerCase();
	}
	else {
		return false;
	}
};

window.checkPeriodicVersion = function (callback) {
	request
		.get('/p-admin/check_periodic_version')
		.set('Accept', 'application/json')
		.end(function (error, res) {
			if (res.error) {
				error = res.error;
			}
			if (error) {
				if (callback) {
					callback(error, null);
				}
				console.error('cannot check periodic version', error);
			}
			else {
				if (res.body) {
					var ajaxResponseData = res.body;
					if (ajaxResponseData.status === 'current') {
						console.info(ajaxResponseData.message);
						if (callback) {
							callback(null, {
								status: 'uptodate',
								response: ajaxResponseData.message
							});
						}
					}
					else {
						window.ribbonNotification.showRibbon(ajaxResponseData.message + ' - <a href="/p-admin/settings#update" style="color:#4593e3;" >upgrade now</a>', 12000, 'warn');
						if (callback) {
							callback(null, {
								status: 'needupdate',
								response: ajaxResponseData.message
							});
						}
					}
				}
			}
		});
};

window.addEventListener('load', function () {
	confirmDeleteYes = document.getElementById('confirm-delete-yes');
	mediaSearchButton = document.getElementById('media-asset-search-button');
	mediafilessearchresult = document.getElementById('media-files-search-result');
	mediafilesresult = document.getElementById('media-files-result');
	window.silkscreenModal = new silkscreen();
	window.ribbonNotification = new ribbon({
		type: 'info',
		idSelector: '#_pea_ribbon-element'
	});
	submitOnChangeListeners();
	preventEnterSubmitListeners();
	ajaxDeleteButtonListeners();
	cloneContentListener();
	if (mediaSearchButton) {
		mediaSearchButton.addEventListener('click', searchMedia, false);
	}
}, false);
