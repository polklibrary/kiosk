
var TODAY_START = new Date();
TODAY_START.setHours(14);
TODAY_START.setMinutes(0);
TODAY_START.setSeconds(0);


var TODAY_END = new Date();
TODAY_END.setHours(15);
TODAY_END.setMinutes(0);
TODAY_END.setSeconds(0);

var GCAL = {

    APIKEY : '',
    CLIENTID : '',
    SCOPES : 'https://www.googleapis.com/auth/calendar',
    
    oauth : function(callback) {
        var self = this;
        this.ready(function(){
            gapi.client.setApiKey(self.APIKEY);            
            gapi.auth.authorize({client_id: self.CLIENTID, scope: self.SCOPES, immediate: false}, function(){
                gapi.client.load('calendar', 'v3', callback); // load calendar api
            });
        });
    }, 
    
    results : function(response) {
        try {
            return response['result']['items'];
        }
        catch(e) {
            console.log("ERROR:  " + e);
            return [];
        }
    },
    
    get_events : function(id, start, end, callback) {
        // No authentication required
        var self = this;
        this.ready(function(){
            gapi.client.setApiKey(self.APIKEY);
            gapi.client.request({
                'path': '/calendar/v3/calendars/'+ id +'/events',
                'params': {
                    'timeMin': start.toISOString(),
                    'timeMax': end.toISOString(),
                    'alwaysIncludeEmail': false,
                    'showDeleted': false,
                    'singleEvents': true,
                    'maxResults': 100,
                    'orderBy': 'startTime'
                }
            }).then(function(resp) {
                callback(resp);
            }, function(reason) {
                callback(reason);
            });
        });
    },
    
   
    ready : function(callback){
        var thread = setInterval(function(){
            console.log('waiting');
            if ( !(typeof gapi.client === 'undefined')) {
                clearInterval(thread);
                callback();
            }
        }, 100);
    },
    
}



var UTILITY = {
    
    date : function(date, h, m, s){
        var d = date.split('-');
        return new Date(parseInt(d[0]),parseInt(d[1])-1,parseInt(d[2]),h,m,s,0);
    },     
    
    // date : function(date, hour, minutes, seconds){
    
        // if (hour < 10)
            // hour = '0' + hour;
        // if (minutes < 10)
            // minutes = '0' + minutes;
        // if (seconds < 10)
            // seconds = '0' + seconds;
            
        // return new Date(date + 'T' + hour + ':' + minutes + ':' + seconds);
    // }, 
    
    text_shorty : function(e) {      
        var w = $(e).width();
        $(e).find('.pat-text-shorty').css('width', (w/2)+'px');
    }, 
    

}



