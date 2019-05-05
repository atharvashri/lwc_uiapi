public with sharing class UiApiController {
    public UiApiController() {

    }

    @AuraEnabled(cacheable=true)
    public static string makeApiCall(string objectApi, string targetId){ //string objectApi,string targetId
        HTTP h = new HTTP();
        HTTPRequest req = new HTTPRequest();
        HttpResponse resp = new HttpResponse();

        String sessionId;
    
        PageReference reportPage = Page.FetchSessionId;
        // Get the content of the VF page
        String vfContent = reportPage.getContent().toString();
        // Find the position of Start_Of_Session_Id and End_Of_Session_Id
        Integer startP = vfContent.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length();
        Integer endP = vfContent.indexOf('End_Of_Session_Id');
        // Get the Session Id
        sessionId = vfContent.substring(startP, endP);
        
        req.setMethod('GET');
        req.setHeader('Authorization', 'OAuth ' + sessionId);
        string endPoint = URL.getSalesforceBaseUrl().toExternalForm() + '/services/data/v45.0/ui-api/lookups/'+ objectApi+'/'+targetId;
        req.setEndpoint(endPoint);
        resp = h.send(req);
        /* eslint-disable no-console */
        System.debug(resp.getBody());
        /* eslint-enable no-console */
        return resp.getBody();
    }

}
