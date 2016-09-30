
var conf=require('../config').conf;
var util=require('util');
var request=require('request');
var async=require('async');




exports.setConfig= function(callback){


    async.parallel([
        function(clb){
            var rqparams={
                url:conf.microserviceAuthMS+ "/tokenactions/getsupeusertokenlist",
                headers : {'Authorization' : "Bearer "+ conf.MyMicroserviceToken}
            };

            request.get(rqparams, function(error, response, body){

                if(error) {
                    callback({error:'internal_User_microservice_error', error_message : error +""},null);

                }else{
                    var appT=JSON.parse(body).superuser;
                    conf.adminUser=appT;
                    clb(null,appT);
                }
            });
        },
        function(clb){
            var rqparams={
                url:conf.microserviceAuthMS+ "/tokenactions/getsuperapptokenlist",
                headers : {'Authorization' : "Bearer "+ conf.MyMicroserviceToken}
            };

            request.get(rqparams, function(error, response, body){

                if(error) {
                    clb({error:'internal_User_microservice_error', error_message : error +""},null);

                }else{
                    var appT=JSON.parse(body).superapp;
                    conf.AdminAuthorizedApp=appT;
                    clb(null,appT);
                }
            });
        },
    ],function(err,results){
        if(err)
            callback(err,null);
        else
            callback(null,results[0].concat(results[1]));
    });

};

//exports.getMyToken = function() {
//
//                conf.MyMicroserviceToken="yJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2RlIjoibXMiLCJpc3MiOiJub3QgdXNlZCBmbyBtcyIsImVtYWlsIjoibm90IHVzZWQgZm8gbXMiLCJ0eXBlIjoiQXV0aE1zIiwiZW5hYmxlZCI6dHJ1ZSwiZXhwIjoxNzgwODM0NTQxMzQxfQ.gJkSUCAkqzIb52s2ITohj7vXx-EXpicObSaJ1uSgdog";
//                return(conf);
//};