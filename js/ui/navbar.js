/**
 * @class elfindernav - elFinder container for diretories tree and places
 *
 * @author Dmitry (dio) Levashov
 **/
$.fn.elfindernavbar = function(fm, opts) {

	this.not('.elfinder-navbar').each(function() {
		var nav    = $(this).hide().addClass('ui-state-default elfinder-navbar'),
			parent = nav.parent(),
			wz     = parent.children('.elfinder-workzone').append(nav),
			delta  = nav.outerHeight() - nav.height(),
			ltr    = fm.direction == 'ltr',
			handle, swipeHandle, autoHide, setWidth,
			cssloaded = function() {
				delta = nav.outerHeight() - nav.height();
			},
			cssloadedMobile,
			setWzRect = function() {
				var cwd = fm.getUI('cwd'),
					wz  = fm.getUI('workzone'),
					wzRect = wz.data('rectangle'),
					cwdOffset = cwd.offset();
				wz.data('rectangle', Object.assign(wzRect, { cwdEdge: (fm.direction === 'ltr')? cwdOffset.left : cwdOffset.left + cwd.width() }));
			};

			if (fm.cssloaded) {
				cssloaded();
			} else {
				fm.one('cssloaded', cssloaded);
			}
			
			fm.bind('wzresize', function() {
				nav.height(wz.height() - delta);
			});
		
		if (fm.UA.Touch) {
			autoHide = fm.storage('autoHide') || {};
			if (typeof autoHide.navbar === 'undefined') {
				autoHide.navbar = (opts.autoHideUA && opts.autoHideUA.length > 0 && $.map(opts.autoHideUA, function(v){ return fm.UA[v]? true : null; }).length);
				fm.storage('autoHide', autoHide);
			}
			
			if (autoHide.navbar) {
				fm.one('init', function() {
					fm.uiAutoHide.push(function(){ nav.stop(true, true).trigger('navhide', { duration: 'slow', init: true }); });
				});
			}
			
			fm.bind('load', function() {
				swipeHandle = $('<div class="elfinder-navbar-swipe-handle"/>').hide().appendTo(wz);
				if (swipeHandle.css('pointer-events') !== 'none') {
					swipeHandle.remove();
					swipeHandle = null;
				}
			});
			
			nav.on('navshow navhide', function(e, data) {
				var mode     = (e.type === 'navshow')? 'show' : 'hide',
					duration = (data && data.duration)? data.duration : 'fast',
					handleW = (data && data.handleW)? data.handleW : Math.max(50, fm.getUI().width() / 10);
				nav.stop(true, true)[mode](duration, function() {
					if (mode === 'show') {
						swipeHandle && swipeHandle.stop(true, true).hide();
					} else {
						if (swipeHandle) {
							swipeHandle.width(handleW? handleW : '');
							fm.resources.blink(swipeHandle, 'slowonce');
						}
					}
					fm.trigger('navbar'+ mode);
					data.init && fm.trigger('uiautohide');
					setWzRect();
				});
				autoHide.navbar = (mode !== 'show');
				fm.storage('autoHide', Object.assign(fm.storage('autoHide'), {navbar: autoHide.navbar}));
			});
		}
		
		if ($.fn.resizable && ! fm.UA.Mobile) {
			handle = nav.resizable({
					handles : ltr ? 'e' : 'w',
					minWidth : opts.minWidth || 150,
					maxWidth : opts.maxWidth || 500,
					stop : function(e, ui) {
						fm.storage('navbarWidth', ui.size.width);
						setWzRect();
					}
				})
				.on('resize scroll', function(e) {
					e.preventDefault();
					e.stopPropagation();
					if (! ltr && e.type === 'resize') {
						nav.css('left', 0);
					}
					clearTimeout($(this).data('posinit'));
					$(this).data('posinit', setTimeout(function() {
						var offset = (fm.UA.Opera && nav.scrollLeft())? 20 : 2;
						handle.css('top', 0).css({
							top  : parseInt(nav.scrollTop())+'px',
							left : ltr ? 'auto' : parseInt(nav.scrollRight() -  offset) * -1,
							right: ltr ? parseInt(nav.scrollLeft() - offset) * -1 : 'auto'
						});
						if (e.type === 'resize') {
							fm.getUI('cwd').trigger('resize');
						}
					}, 50));
				})
				.children('.ui-resizable-handle').addClass('ui-front');

			fm.one('opendone', function() {
				handle.trigger('resize');
			});
		}

		if (setWidth = fm.storage('navbarWidth')) {
			nav.width(setWidth);
		} else {
			if (fm.UA.Mobile) {
				cssloadedMobile = function() {
					var set = function() {
						setWidth = nav.parent().width() / 2;
						if (nav.data('defWidth') > setWidth) {
							nav.width(setWidth);
						} else {
							nav.width(nav.data('defWidth'));
						}
						nav.data('width', nav.width());
					}
					nav.data('defWidth', nav.width());
					$(window).on('resize.' + fm.namespace, set);
					set();
				};
				if (fm.cssloaded) {
					cssloadedMobile();
				} else {
					fm.one('cssloaded', cssloadedMobile);
				}
			}
		}

	});
	
	return this;
};
