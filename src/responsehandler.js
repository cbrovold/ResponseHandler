//= require jquery
//= require toaster

var AlertResponseHandler = { 
	success: function (msg) {
		alert(msg);
	},
	error: function (msg) {
		alert(msg);
	}
};

var ToasterResponseHandler = {
	success: function (msg) {
		this.toaster.success(msg);
	},
	error: function (msg) {
		this.toaster.error(msg);
	}
};

var RedirectResponseHandler = {
	success: function (url) {
		document.location.href = url;
	}
};

var DestroyResponseHandler = {
	success: function (data) {
		var el = $('[data-id="'+data+'"]');
		el.slideUp('slow', function () {
			el.remove();
		});
	}
};

var DataResponseHandler = {
	success: function (data) {
		console.log(data);
	}
};

var ValidationResponseHandler = {
	error: function(data) {
		var map = {},
			buildMap = function (data, parent) {
				for (var n in data) {
					var o = data[n],
						id = (parent) ? parent + '_' + n : n;

					if($.isArray(o)) {
						map[id] = o;
					} else if (typeof(o) === 'object') {
						buildMap(o, id);
					}
				}
			};

		buildMap(data);
		for (var s in map) {
			var el = $('[name="' + s + '"]');

			el.attr('title', map[s].join(','));
			el.addClass('error');
			el.live('change', function () {
				$(this).removeClass('error').unbind();
				$(this).removeAttr('title');
			});
		}
	}
};


var ResponseHandlerFactory = function (config) {
	
	config = config||{};
	
	var toaster = new Toaster('#toaster'),
		handlers = config.handlers||{},
		// This will chain the events based on the
		error = function (response) {
			for (var a in response) {
				if (handlers[a]) {
					handlers[a].error.call(this, response[a]);
				}
			}
		},
		success = function (response) {
			for (var a in response) {
				if (handlers[a]) {
					handlers[a].success.call(this, response[a]);
				}
			}
		},
		baseConfig = {};
	
	baseHandler = AlertResponseHandler;
	if (toaster && toaster.exists) {
		baseHandler = ToasterResponseHandler;
		this.toaster = toaster;
	}

	for (var a in handlers) {
		handlers[a] = $.extend(false, baseHandler, handlers[a]);
	}
	handlers['message'] = baseHandler;

	me = this;
	me.success = success;
	me.error = error;
	
	return me;
};

var ResponseHandler = {
	
	current:null,
	error: function (response) {
		this.current.error(response);
	},
	success: function (response) {
		this.current.success(response);
	}
};