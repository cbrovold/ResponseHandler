//= require jquery
//= require toaster
(function ($) {

	var SearchResponseHandler, AlertResponseHandler, ToasterResponseHandler, WarningResponseHandler, RedirectResponseHandler,
		DestroyResponseHandler, ValidationResponseHandler, AddResponseHandler, ResponseHandlerFactory, ResponseHandler,
		_tableDataResponse = {
			mapData: function (thead) {
				var map = {};
				thead.find('th').each(function () {
					var n = $(this).attr('data-col');
					map[n] = {
						type: $(this).attr('data-type')||'string'
					}
					if(p = $(this).attr('data-pattern')) {
						map[n]['pattern'] = p;
					}
					if(re = $(this).attr('data-re')) {
						map[n]['re'] = new RegExp(re);
					}
				});
				return map;
			},
			addRows: function (map, data) {
				var me = this, output = '';
				$.each(data, function () {
					var o = this;
					output += _tableDataResponse.addRow.call(me, map, this);
				});
				return output;
			},
			addRow: function (map, o) {
				var output = '<tr data-id="' + o.id + '">';
				for(var n in map) {
					var val = _tableDataResponse.formats[map[n].type].call(map[n], o, n);
					output += '<td>' + val + '</td>';
				}
				output += '</tr>';
				return output;
			},
			formats: {
				date: function (v, key) {
					return (new Date(v[key])).format(this.pattern||'m/dd/yyyy');
				},
				currency: function (v, key) {
					var f = parseFloat(v[key]);
					f = Math.round(f*Math.pow(10, 2)) / Math.pow(10, 2)
					return '$'+f;
				},
				string: function (v, key) {
					return v[key];
				},
				url: function (v, key) {
					var url = this.pattern,
						m = url.match(this.re, '');

					for (var a=0; a<m.length; a++) {
						var val = m[a].replace('$','');
						url = url.replace(m[a], v[val]);
					}
					return '<a href="' + url + '">' + v[key] + '</a>';
				},
				empty: function (v, key) {
					return '&nbsp;';
				}
			}
		};

	GridResponseHandler = {
		success: function (data) {
			var table = $('table.add'),
				thead = table.find('thead'),
				tbody = table.find('tbody'),
				map = _tableDataResponse.mapData.call(this, thead),
				output = _tableDataResponse.addRow.call(this, map, data);
			
			tbody.append(output);
			tbody.slideDown();
		}
	}

	SearchResponseHandler = {
		success: function (data) {
			var table = $('table.search'),
				thead = table.find('thead'),
				tbody = table.find('tbody'),
				map = _tableDataResponse.mapData.call(this, thead),
				output = _tableDataResponse.addRows.call(this, map, data);
			
			tbody.html(output);
			tbody.slideDown();
		}
	};

	AlertResponseHandler = { 
		success: function (msg) {
			alert(msg);
		},
		error: function (msg) {
			alert(msg);
		}
	};

	ToasterResponseHandler = {
		success: function (msg) {
			this.toaster.success(msg);
		},
		error: function (msg) {
			this.toaster.error(msg);
		}
	};

	WarningResponseHandler = {
		success: function (msg) {
			this.toaster.warn(msg);
		}
	};

	RedirectResponseHandler = {
		success: function (url) {
			document.location.href = url;
		}
	};

	DestroyResponseHandler = {
		success: function (data) {
			var el = $('[data-id="'+data+'"]');
			el.slideUp('slow', function () {
				el.remove();
			});
		}
	};

	ValidationResponseHandler = {
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
				var el = $('#' + s);
				el.addClass('error');
				el.attr('title', map[s][0]);
				el.change( function () {
					$(this).removeClass('error').unbind();
					$(this).removeAttr('title');
				});
			}
		}
	};


	ResponseHandlerFactory = function (config) {
		
		config = config||{};
		
		var toaster = $('#toaster').toaster(),
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
					if (handlers[a]) handlers[a].success.call(this, response[a]);
				}
			},
			baseConfig = {};
		
		baseHandler = AlertResponseHandler;
		if (toaster.exists) {
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

	ResponseHandler = {
		
		current:null,
		error: function (response) {
			this.current.error(response);
		},
		success: function (response) {
			this.current.success(response);
		}
	};

	$.responseHandler = ResponseHandler;
	$.fn.responseHandlerFactory = ResponseHandlerFactory;
	$.responseHandler.map = {
		url:RedirectResponseHandler,
		search:SearchResponseHandler,
		destroy:DestroyResponseHandler,
		validation:ValidationResponseHandler,
		warning:WarningResponseHandler,
		grid:GridResponseHandler
	};

})(jQuery);