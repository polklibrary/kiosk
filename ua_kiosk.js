// Create Tracker
	var ua = new UniversalAnalyticsTracker('polk', {
		'ua_account_live': 'UA-25321418-1',
		'ua_matchurl_live': 'localhost',
		'ua_account_test': 'UA-9924341-1',
		'defined_dimensions':{'dimension2':'Kiosk'},
		'auto_pageview': false,
	});

    var kiosk_local = {
        KIOSK_HEADER : 'Kiosk - Header',
        KIOSK_FOOTER : 'Kiosk - Footer',
        KIOSK_HOURS : 'Kiosk - Hours',
        KIOSK_COMPUTERS : 'Kiosk - Computers',
        KIOSK_DIRECTIONS : 'Kiosk - Directions',
        KIOSK_GROUPS : 'Kiosk - Groups',
        KIOSK_SHUTTLE : 'Kiosk - Shutte'
    }

    

// HEADER ========================================================================================
	ua.set_test_group('HEADER');
	ua.ev("#header-hours", "click", kiosk_local.KIOSK_HEADER, pas.VIEW_PAGE, 'Hours');

// FOOTER ========================================================================================
	ua.set_test_group('FOOTER');
	ua.ev("#refresh", "click", kiosk_local.KIOSK_FOOTER, 'Refresh Page');


// SIDE TABS ========================================================================================
	ua.set_test_group('TABS');
	ua.ev("#hours-tab", "click", kiosk_local.KIOSK_HOURS, pas.VIEW_PAGE);
	ua.ev("#computers-tab", "click", kiosk_local.KIOSK_COMPUTERS, pas.VIEW_PAGE);
	ua.ev("#directions-tab", "click", kiosk_local.KIOSK_DIRECTIONS, pas.VIEW_PAGE);
	ua.ev("#groups-tab", "click", kiosk_local.KIOSK_GROUPS, pas.VIEW_PAGE);


// DIRECTIONS ========================================================================================
	ua.set_test_group('DIRECTIONS');
    
	ua.ev("#directions-table td", "click", kiosk_local.KIOSK_DIRECTIONS, pas.VIEW_DIRECTIONS, function(t){
        return $(t).text();
    });
    ua.remove_tracking(['#directions-table td.no-action']);

    
// GROUPS ========================================================================================
	ua.set_test_group('GROUPS');
	ua.ev("#groups-table", "click", kiosk_local.KIOSK_GROUPS, pas.VIEW_DIRECTIONS);
