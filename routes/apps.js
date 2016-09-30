var express = require('express');
var middlewares = require('./middlewares');
var Application = require('../models/apps').App;
var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var jwtMiddle = require('./jwtauth');
var conf=require('../config').conf;
var async=require('async');

var request = require('request');

var microserviceBaseURL=conf.microserviceAuthMS;
var microserviceTokem=conf.MyMicroserviceToken;

router.use(middlewares.parsePagination);
router.use(middlewares.parseFields);

// Begin Macro

/**
 * @apiDefine  NotFound
 * @apiError 404_NotFound <b>NotFound:</b> the Object with specified <code>id</code> was not found.<BR>
 * <b>request.body.error</b> contains an error name specifing the not Found Error.<BR>
 * <b>request.body.erro_messager</b> contains an error message specifing the not Found Error.<BR>
 */

/**
 * @apiDefine Metadata
 * @apiSuccess {Object} _metadata object containing metadata for pagination information
 * @apiSuccess {Number} _metadata.skip  Skips the first skip results of this Query
 * @apiSuccess {Number} _metadata.limit  Limits the number of results to be returned by this Query.
 * @apiSuccess {Number} _metadata.totalCount Total number of query results.
 */


/**
 * @apiDefine  ServerError
 * @apiError 500_ServerError <b>ServerError:</b>Internal Server Error. <BR>
 * <b>request.body.error</b> contains an error type message specifing the problem as: <i>Db Internal Microservice Error ....</i><BR>
 * <b>request.body.error_message</b> Error Message specifing the problem  as: <i>Connection Down</i><BR>
 * @apiErrorExample Error-Response: 500 Internal Server Error
 *     HTTP/1.1 500 Internal Server Error
 *      {
 *         error: 'Internal Error'
 *         error_message: 'something blew up, ERROR: No MongoDb Connection'
 *      }

 */

/**
 * @apiDefine  BadRequest
 * @apiError 400_BadRequest <b>BadRequest:</b> The server cannot or will not process the request due to something that is perceived to be a client error<BR>
 * <b>request.body.error</b> Error name as: <i>BadRequest ....</i><BR>
 * <b>request.body.error_message</b> Error Message specifing the problem as: <i>malformed request syntax, invalid reques, invalid fields ....</i><BR>
 *
 *  @apiErrorExample Error-Response: 400 BadRequest
 *     HTTP/1.1 400 InvalidRequest
 *      {
 *         error:'BadRequest',
 *         error_message:'no body sended',
 *      }
 */



/**
 * @apiDefine  Unauthorized
 * @apiError 401_Unauthorized <strong>Unauthorized:</strong> not authorized to call this endpoint.<BR>
 * <b>request.body.error</b> Error name specifing the problem as: <i>NotAuthorized ....</i><BR>
 * <b>request.body.error_message</b> Error Message specifing the problem  as: <i>only admin user can create WeUiMS</i><BR>
 * @apiErrorExample Error-Response: 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *      {
 *         error:"invalid_token",
 *         error_description:"Unauthorized: The access token expired"
 *      }
 */



/**
 * @apiDefine  IvalidUserAanPassword
 * @apiError 403_Unauthorized <strong>Unauthorized:</strong> username or password not valid.<BR>
 * <b>request.body.error</b> Error name specifing the problem as: <i>Not Logged ....</i><BR>
 * <b>request.body.error_message</b> Error Message specifing the problem  as: <i>wrong username or password</i><BR>
 * @apiErrorExample Error-Response: 403 Unauthorized
 *     HTTP/1.1 403 Unauthorized
 *      {
 *         error:"Unauthorized",
 *         error_description:"Warning: wrong username"
 *      }
 */


/**
 * @apiDefine GetResource
 * @apiSuccess {Object[]} apps a paginated array list of users objects
 * @apiSuccess {String} apps.id User id identifier
 * @apiSuccess {String} apps.field1 fiend 1 defined in schema
 * @apiSuccess {String} apps.field2 fiend 2 defined in schema
 * @apiSuccess {String} apps.fieldN fiend N defined in schema
 *
 */


/**
 * @apiDefine GetResourceExample
 * @apiSuccessExample {json} Example: 200 OK, Success Response
 *
 *     {
 *       "apps":[
 *                      {
 *                          "id": "543fdd60579e1281b8f6da92",
 *                          "email": "prova@prova.it",
 *                          "name": "prova",
 *                          "notes": "Notes About prova"
 *                      },
 *                      {
 *                          "id": "543fdd60579e1281sdaf6da92",
 *                          "email": "prova1@prova.it",
 *                          "name": "prova1",
 *                          "notes": "Notes About prova1"
 *
 *                     },
 *                    ...
 *                 ],
 *
 *       "_metadata":{
 *                   "skip":10,
 *                   "limit":50,
 *                   "totalCount":100
 *               }
 *    }
 */

// end Macro


/**
 * @api {post} /apps/signup Register a new Application
 * @apiVersion 1.0.0
 * @apiName Create Application
 * @apiGroup Application
 *
 * @apiDescription Accessible by access_token of type specified in config.js SignUpAuthorizedAppAndMS field. It create a new Application object and return the access_credentials.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String} application the user dictionary with all the fields, only email, password and type are mandatory.
 *
 *
 * @apiParamExample {json} Request-Example:
 * HTTP/1.1 POST request
 *  Body:{ "email": "prova@prova.it" , "password":"provami", "type":"ext", "name":"nome"}
 *

 * @apiSuccess (201 - Created) {Object} access_credentials contains information about access_credemtials.
 * @apiSuccess (201 - Created) {Object} access_credentials.apiKey  contains information about apiKey
 * @apiSuccess (201 - Created) {String} access_credentials.apiKey.token  contains user Token
 * @apiSuccess (201 - Created) {String} access_credentials.apiKey.expires  contains information about token life
 * @apiSuccess (201 - Created) {Object} access_credentials.refreshToken  contains information about refreshToken used to renew token
 * @apiSuccess (201 - Created) {String} access_credentials.refreshToken.token  contains user refreshToken
 * @apiSuccess (201 - Created) {String} access_credentials.refreshToken.expires  contains information about refreshToken life

 * @apiSuccess (201 - Created) {Object} Created_resource contains the created User resource
 * @apiSuccess (201 - Created) {String} Created_resource.UserField_1 Contains field 1 defined in Application Schema(example name)
 * @apiSuccess (201 - Created) {String} Created_resource.UserField_2 Contains field 2 defined in Application Schema(example surname)
 * @apiSuccess (201 - Created) {String} Created_resource.UserField_N Contains field N defined in Application Schema(example type)
 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *        "created_resource":{
 *                 "name":"Micio",
 *                 "email":"mario@caport.com",
 *                 "id":"57643332ab9293ff0b5da6f0"
 *        },
 *        "access_credentials":{
 *                 "apiKey":{
 *                         "token":"VppR5sHU_hV3U",
 *                         "expires":1466789299072
 *                  },
 *                  "refreshToken":{
 *                          "token":"eQO7de4AJe-syk",
 *                          "expires":1467394099074
 *                   }
 *        }
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 *
 */

//router.post('/signup',[middlewares.ensureUserIsAuthAppOrAdmin],function(req, res){
router.post('/signup',[jwtMiddle.decodeToken],function(req, res){

    //console.log("USER SIGNUP " + conf.AdminAuthorizedApp);

    // if(req.application.valid){ //if ot valid retuen in jwtaut midleware
    //  if(conf.SignUpAuthorizedApp.indexOf(req.User_App_Token.type)>=0 ){ // se il token è di un app che può fare login

    if(!req.body || _.isEmpty(req.body) )  return res.status(400).send({error:"no_body",error_message:'request body missing'});


    var application = req.body.application;
    //var password = req.body.application.password;

    if (!application) return res.status(400).send({error: 'BadREquest', error_message : "No application sent"});

    if((conf.AdminAuthorizedApp.indexOf(application.type)>=0) && (!(conf.adminUser.indexOf(req.User_App_Token.type)>=0))) // se il token è di un utente non Admin))to create admin application
        return res.status(401).send({error: 'not Authorized', error_message : "Only Admin User can register admin application"});


    //if (!password) return res.status(400).send({error: 'no password sent', error_message : "No password provided"});
    //delete application['password'];

    //registra l'utente sul microservizio autenticazione


    var loginApp={
        "email":application.email,
        "password":application.password,
        "type":application.type
    };

    var rqparams={
        url:microserviceBaseURL+'/authApp/signup',
        headers : {'Authorization' : "Bearer "+ microserviceTokem, 'content-type': 'application/json'},
        body:JSON.stringify({app:loginApp})
    };

//    console.log("signUp request param"+JSON.stringify(rqparams));

    request.post(rqparams, function(error, response, body){

        if(error) {
            return  res.status(500).send({error:'internal_microservice_error', error_message : error +""});
        }else{

            console.log("signUp response body"+body);
            var loginToken = JSON.parse(body);

            if(!loginToken.error){ // ho un token valido
                application.id=loginToken.userId;
                delete application['password'];
                delete application['type'];
                delete loginToken['userId'];
                try {
                    Application.create(application, function (err, newApp) {
                        if (err) {
                            rqparams = {
                                url: microserviceBaseURL + '/authapp/' + application.id,
                                headers: {'Authorization': "Bearer " + microserviceTokem}
                            };

                            request.delete(rqparams, function (error, response, body) {
                                if (error)
                                    console.log("inconsistent data");
                                //TODO se in seguito ad una creazione utente non andat a buon fine l'eliminazione dell utente sul microservizio auth non va a buon fine si hanno dati inconsistenti

                            });
                            return res.status(500).send({error: 'internal_Error', error_message: err});

                        } else {
                            var tmpU = JSON.parse(JSON.stringify(newApp));
                            console.log("new application:" + util.inspect(tmpU));
                            delete tmpU['__v'];
                            delete tmpU['_id'];
                            return res.status(201).send({"created_resource": tmpU, "access_credentials": loginToken});
                        }
                    });
                }catch (ex) {
                    //console.log("ECCCEPTIO "+ ex);
                    rqparams = {
                        url: microserviceBaseURL + '/authapp/' + application.id,
                        headers: {'Authorization': "Bearer " + microserviceTokem}
                    };

                    request.delete(rqparams, function (error, response, body) {
                        if (error)
                            console.log("inconsistent data");
                        //TODO se in seguito ad una creazione utente non andat a buon fine l'eliminazione dell utente sul microservizio auth non va a buon fine si hanno dati inconsistenti

                    });
                    return res.status(500).send({
                        error: "signup_error",
                        error_message: 'Unable to register application (err:' + ex + ')'
                    });
                }
            } else{
                return res.status(response.statusCode).send(loginToken);
            }
        }
    });

    //} else{
    //   res.status(401).send({error: "invalid_token", error_description: "Unauthorized: The access token is not valid to access the resource. Use access_token of this type:" + conf.SignUpAuthorizedApp});
    //}
    //}else{
    //    res.status(401).send({error: "invalid_token", error_description:req.application.error_description });
    //}


});





/**
 * @api {post} /apps/signin Application login
 * @apiVersion 1.0.0
 * @apiName Login Application
 * @apiGroup Application
 *
 * @apiDescription Accessible by access_token of type specified in config.js SignInAuthorizedAppAndMS field. It login Application and return the access_credentials.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String} username the email 
 * @apiParam {String} password the password 
 *
 *
 * @apiParamExample {json} Request-Example:
 * HTTP/1.1 POST request
 *  Body:{ "username": "prov@prova.it" , "password":"provami"}
 *
 * @apiSuccess (201 - Created) {Object} access_credentials contains information about access_credemtials.
 * @apiSuccess (201 - Created) {Object} access_credentials.apiKey  contains information about apiKey
 * @apiSuccess (201 - Created) {String} access_credentials.apiKey.token  contains user Token
 * @apiSuccess (201 - Created) {String} access_credentials.apiKey.expires  contains information about token life
 * @apiSuccess (201 - Created) {Object} access_credentials.refreshToken  contains information about refreshToken used to renew token
 * @apiSuccess (201 - Created) {String} access_credentials.refreshToken.token  contains user refreshToken
 * @apiSuccess (201 - Created) {String} access_credentials.refreshToken.expires  contains information about refreshToken life
 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *        "access_credentials":{
 *                 "apiKey":{
 *                         "token":"VppR5sHU_hV3U",
 *                         "expires":1466789299072
 *                  },
 *                  "refreshToken":{
 *                          "token":"eQO7de4AJe-syk",
 *                          "expires":1467394099074
 *                   }
 *        }
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 * @apiUse IvalidUserAanPassword
 *
 */
router.post('/signin',[jwtMiddle.decodeToken] ,function(req, res){



    // if(req.user.valid){ //if ot valid retuen in jwtaut midleware
    //  if(conf.AdminAuthorizedApp.indexOf(req.User_App_Token.type)>=0 ){ // se il token è di un app che può fare login

    if(!req.body || _.isEmpty(req.body) )  return res.status(400).send({error:"BadRequest",error_message:'request body missing'});


    var username = req.body.username;
    var password = req.body.password;

    if (!username || !password) return res.status(400).send({error: 'BadRequest', error_message : "No username o password provided"});



    var rqparams={
        url:microserviceBaseURL+'/authApp/signin',
        headers : {'Authorization' : "Bearer "+ microserviceTokem, 'content-type': 'application/json'},
        body:JSON.stringify({username:username,password:password})
    };

    request.post(rqparams, function(error, response, body){

        if(error) {
            return  res.status(500).send({error:'internal_microservice_error', error_message : error +""});
        }else{

            console.log("signUp response body"+body);
            var loginToken = JSON.parse(body);

            if(!loginToken.error){ // ho un token valido
                  return res.status(201).send({"access_credentials":loginToken});
            }
            else  return res.status(response.statusCode).send(loginToken);

            }
    });

});




/**
 * @api {get} /apps/ Get all Applications
 * @apiVersion 1.0.0
 * @apiName Get Applications
 * @apiGroup Application
 *
 * @apiDescription Accessible by admin user access_token specified in config.js adminUser field. It returns the paginated list of all Applications.
 * To set pagination skip and limit, you can do it in the URL request, for example "get /apps?skip=10&limit=50"
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ as query param || header]
 *
 *
 *
 * @apiUse Metadata
 * @apiUse GetResource
 * @apiUse GetResourceExample
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 *
 */

router.get('/', [jwtMiddle.decodeToken], function(req, res) {

    //TODO: returns ALL users, must be changed to return only authorized users
    //given an authenticated user (by token)

    //console.log(req);

    var fields = req.dbQueryFields;
    if (!fields)
        fields = '-hash -salt -__v -_id';


        var query = {};

    for (var v in req.query)
        if (Application.schema.path(v))
            query[v] = req.query[v];

        Application.findAll(query, fields, req.dbPagination, function(err, results){

        if(!err){

            if (results)
                res.status(200).send(results);
            else
                res.status(204).send();
        }
        else{
            res.status(500).send({error:'internal_error', error_message: 'something blew up, ERROR:'+err  });
        }
    });
});

///* POST user creation. */
//router.post('/',[middlewares.ensureUserIsAdmin], function(req, res) {   //FIXME: replace with signup???
//    //Authorized just admins
//    console.log("USER SIGNUP " + conf.AdminAuthorizedApp);
//
//    // if(req.user.valid){ //if ot valid retuen in jwtaut midleware
//    //  if(conf.AdminAuthorizedApp.indexOf(req.User_App_Token.type)>=0 ){ // se il token è di un app che può fare login
//
//    if(!req.body || _.isEmpty(req.body) )  return res.status(400).send({error:"BadRequest",error_message:'request body missing'});
//
//    //console.log("signUp request user body"+JSON.stringify(req.body.user));
//    var user = req.body.user;
//    //var password = req.body.user.password;
//
//    if (!user) return res.status(401).send({error: 'no user sent', error_message : "No username provided"});
//    //if (!password) return res.status(400).send({error: 'no password sent', error_message : "No password provided"});
//    //delete user['password'];
//
//    //registra l'utente sul microservizio autenticazione
//
//    //console.log("signUp request user body"+JSON.stringify(user));
//
//
//    var rqparams={
//        url:microserviceBaseURL+'/authApp/signup',
//        headers : {'Authorization' : "Bearer "+ microserviceTokem, 'content-type': 'application/json'},
//        body:JSON.stringify({user:user})
//    };
//
//    //console.log("signUp request param"+JSON.stringify(rqparams));
//
//    request.post(rqparams, function(error, response, body){
//
//        if(error) {
//            return  res.status(500).send({error:'internal_microservice_error', error_message : error +""});
//        }else{
//
//            console.log("signUp response body"+body);
//            var loginToken = JSON.parse(body);
//
//            if(!loginToken.error){ // ho un token valido
//                user.id=loginToken.userId;
//                delete user['password'];
//                delete user['type'];
//                delete loginToken['userId'];
//                Application.create(user,function(err,newUser){
//                    if(err){
//                        rqparams={
//                            url:microserviceBaseURL+'/authApp/' + loginToken.userId,
//                            headers : {'Authorization' : "Bearer "+ microserviceTokem}
//                        };
//
//                        request.delete(rqparams, function(error, response, body) {
//                            if (error)
//                                console.log("inconsistent data");
//                            //TODO se in seguito ad una creazione utente non andat a buon fine l'eliminazione dell utente sul microservizio auth non va a buon fine si hanno dati inconsistenti
//
//                        });
//                        return res.status(500).send({error: 'internal_Error', error_message : err});
//
//                    }else{
//                        var tmpU=JSON.parse(JSON.stringify(newUser));
//                        console.log("new user:"+ util.inspect(tmpU));
//                        delete tmpU['__v'];
//                        delete tmpU['_id'];
//                        return res.status(201).send({"created_resource":tmpU, "access_credentials":loginToken});
//                    }
//                });
//            } else{
//                return res.status(401).send(loginToken);
//            }
//        }
//    });
//
//    //} else{
//    //   res.status(401).send({error: "invalid_token", error_description: "Unauthorized: The access token is not valid to access the resource. Use access_token of this type:" + conf.AdminAuthorizedApp});
//    //}
//    //}else{
//    //    res.status(401).send({error: "invalid_token", error_description:req.user.error_description });
//    //}
//
//
//});


/**
 * @api {get} /apps/:id Get the Application by id
 * @apiVersion 1.0.0
 * @apiName GetApplication
 * @apiGroup Application
 *
 * @apiDescription Returns the info about Application. To call this endpoint must have an admin account or must be the Application itself.
 *
 * @apiSuccess {String} Application.id Application id identifier
 * @apiSuccess {String} Application.field1 field 1 defined in schema
 * @apiSuccess {String} Application.field2 field 2 defined in schema
 * @apiSuccess {String} Application.fieldN field N defined in schema
 *
 * @apiSuccessExample {json} Example: 200 OK, Success Response
 *
 *     {
 *
 *        "id": "543fdd60579e1281b8f6da92",
 *        "email": "prova@prova.it",
 *        "name": "prova",
 *        "notes": "Notes About prova"
 *     }
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 */
router.get('/:id',[jwtMiddle.decodeToken,middlewares.ensureUserIsAdminOrSelf], function(req, res) {

    //TODO: must be changed to return only authorized users
    //given an authenticated user (by token)

    var fields = req.dbQueryFields;
    if (!fields)
        fields = '-hash -salt -__v -_id';

        var id = req.param('id').toString();

    Application.findOne({id:id}, fields, function(err, results){
        if(!err){
                res.send(results);
        }
        else{
            if (results === {} || results === undefined)   res.status(404).send({ error:'notFound',error_message: 'application not found'  });
            else res.status(500).send({error:'internal_error', error_message: 'something blew up, ERROR:'+err  });
        }
    });
});


/**
 * @api {put} /apps/:id Update Application
 * @apiVersion 1.0.0
 * @apiName Update Application
 * @apiGroup Application
 *
 * @apiDescription Accessible by access_token, It update Application object and return the updated resource.
 * To call this endpoint must have an admin token or must be the Application itself.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String} application the Application dictionary with all the fields to update, only email(username), password(there is a reset password endpoint and Application type can  be updated only whith admin token.
 *
 *
 * @apiParamExample {json} Request-Example:
 * HTTP/1.1 PUT request
 *  Body:{ "name":"nome", "surname":"cognome"}
 *
 * @apiSuccess (201 - Created) {String} ApplicationField_1 Contains field 1 updated and defined in Application Schema(example name)
 * @apiSuccess (201 - Created) {String} ApplicationField_2 Contains field 2 updated and defined in Application Schema(example notes)
 * @apiSuccess (201 - Created) {String} ApplicationField_N Contains field N updated and defined in Application Schema(example type)
 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *        "name":"Micio",
 *        "notes":"Macio",
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 *
 */
router.put('/:id', [jwtMiddle.decodeToken,middlewares.ensureUserIsAdminOrSelf], function(req,res){

    console.log("PUT");

    if (!req.body || _.isEmpty(req.body)) {
        return res.status(400).send({error:"BadRequest",error_message: 'request body missing'});
    }

    var id = req.param('id').toString();
    var newVals;
    try {
        newVals = req.body.application; // body already parsed
    } catch (e) {
        res.status(500).send({error: "update error", error_message: 'no application updated (error:' + e + ')'});
    }

    if (newVals.password) {
        return res.status(400).send({error:"BadRequest",error_message: 'password is not a valid param. You must call reset pasword enpoint'});
    }

    if (newVals.enabled) {
        return res.status(400).send({error:"BadRequest",error_message: 'enabled or validated is not a valid param. You must call validate enpoint'});
    }

    if (!(conf.adminUser.indexOf(req.User_App_Token.type)>=0) && newVals.email) {
        return res.status(401).send({error:"Forbidden",error_message: 'only admins users can update email'});
    }

    if (!(conf.adminUser.indexOf(req.User_App_Token.type)>=0) && newVals.type) {
        return res.status(401).send({error:"Forbidden",error_message: 'only admins users can update application type'});
    }

    Application.findOneAndUpdate({id:id}, newVals, {new: true}, function (err, results) {

        if (!err) {
            if (results) {
                var tmpU=JSON.parse(JSON.stringify(results));
                console.log("new app:"+ util.inspect(tmpU));
                delete tmpU['__v'];
                delete tmpU['_id'];
                    res.status(200).send(tmpU);
            }
            else {
                res.status(404).send({error: "Notfound", error_message: 'no application found with specified id'});
            }

        }
        else {
            res.status(500).send({error: "internal error", error_message: 'something blew up, ERROR:' + err });
        }
    });
});



function enableDisable(req,res,value){

    var id = req.param('id').toString();

    var rqparams={
        url:value ? microserviceBaseURL+ "/authApp/" +id+'/actions/enable' : microserviceBaseURL+ "/authApp/" +id+'/actions/disable',
        headers : {'Authorization' : "Bearer "+ microserviceTokem}
    };


    console.log(util.inspect(rqparams));

    request.post(rqparams, function(error, response, body){

        if(error) {
            return  res.status(500).send({error:'internal_App_microservice_error', error_message : error +""});
        }else{
            return  res.status(201).send(body);
        }
    });
}



/**
 * @api {post} /apps/:id/actions/resetpassword Reset Application password
 * @apiVersion 1.0.0
 * @apiName ResetPassword
 * @apiGroup Application
 *
 * @apiDescription Accessible by admin or AuthApp access_token defined in config.js, It create a reset password Token.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String} id the Application id or username(email) the identify the Application
 *
 *
 *
 * @apiSuccess (201 - Created) {String} reset_token Contains grant token to set the new password
 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *        "reset_token":"ffewfh5hfdfds7678d6fsdf7d6fsdfd86d8sf6", *
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 *
 */
router.post('/:id/actions/resetpassword', [jwtMiddle.decodeToken], function(req, res){

    var id = req.param('id').toString();

    async.series([
            function(callback){
                if(id.indexOf("@")>=0) { // è un ndirizzo email
                    if (id.search(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/igm) >= 0) { // è una mail valida
                        Application.findOne({email: id}, function (err, usr) {
                            if (err) callback({err_code:500, error: 'internal_error', error_message: err + ""},'one');


                            if (!usr)
                                callback({err_code:404, error: 'NotFound', error_message: "no application found whith " + id + " email"},'one');
                            id = usr.id;
                            callback(null, 'one');
                        });

                    } else { // non è na mail valida
                        callback({err_code:400, error: 'BadRequest', error_message: "Please fill a valid email address"},'one');
                    }
                }else{
                    callback(null, 'one');
                }
            }
        ],
        function(err, results){

            if(err){
                return  res.status(err.err_code).send({error:err.error, error_message : err.error_message +""});
            }else{
                var rqparams={
                    url:microserviceBaseURL+ "/authApp/" +id+'/actions/resetpassword',
                    headers : {'Authorization' : "Bearer "+ microserviceTokem}
                };

                console.log("req" + util.inspect(rqparams));

                request.post(rqparams, function(error, response, body){

                    if(error) {
                        return  res.status(500).send({error:'internal_App_microservice_error', error_message : error +""});
                    }else{
                        return  res.status(201).send(body);
                    }
                });
            }
        });
});






/**
 * @api {post} /apps/:id/actions/setpassword Set new Application password
 * @apiVersion 1.0.0
 * @apiName SetPassword
 * @apiGroup Application
 *
 * @apiDescription Accessible by access_token, It update Application password. To call this endpoint must have an admin token or must be the User itself or reset_token.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String} id the Application id or username(email) the identify the Application
 *
 *
 *
 * @apiSuccess (201 - Created) {Object} access_credentials contains information about access_credemtials.
 * @apiSuccess (201 - Created) {Object} access_credentials.apiKey  contains information about apiKey
 * @apiSuccess (201 - Created) {String} access_credentials.apiKey.token  contains user Token
 * @apiSuccess (201 - Created) {String} access_credentials.apiKey.expires  contains information about token life
 * @apiSuccess (201 - Created) {Object} access_credentials.refreshToken  contains information about refreshToken used to renew token
 * @apiSuccess (201 - Created) {String} access_credentials.refreshToken.token  contains user refreshToken
 * @apiSuccess (201 - Created) {String} access_credentials.refreshToken.expires  contains information about refreshToken life
 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *        "access_credentials":{
 *                 "apiKey":{
 *                         "token":"VppR5sHU_hV3U",
 *                         "expires":1466789299072
 *                  },
 *                  "refreshToken":{
 *                          "token":"eQO7de4AJe-syk",
 *                          "expires":1467394099074
 *                   }
 *        }
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 */
router.post('/:id/actions/setpassword', [jwtMiddle.decodeToken], function(req, res){

    if(!req.body) return res.status(400).send({error:"BadREquest",error_message:'request body missing'});

    var oldpassword = req.body.oldpassword || null;
    var newpassword = req.body.newpassword || null;
    var reset_token=req.body.reset_token || null;

    if (!oldpassword && !reset_token){
        return res.status(400).send({error: 'BadRequest', error_message : "No oldpassword o reset_token provided"});
    }

    if (oldpassword && reset_token) {
        return res.status(400).send({error: 'BadRequest', error_message : "Use oldpassword or reset_token"});
    }

    if (!newpassword) return res.status(400).send({error: 'BadREquest', error_message : "No newpassword provided"});

    var id = (req.params.id).toString();
    var tmpbody;

    async.series([
            function(callback){
                if(id.indexOf("@")>=0) { // è un ndirizzo email
                    if (id.search(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/igm) >= 0) { // è una mail valida
                        Application.findOne({email: id}, function (err, usr) {
                            if (err) callback({err_code:500, error: 'internal_error', error_message: err + ""},'one');

                            if (!usr)callback({err_code:404, error: 'NotFound', error_message: "no App found whith " + id + " email"},'one');

                            id = usr.id;
                            callback(null, 'one');
                        });

                    } else { // non è na mail valida
                        callback({err_code:400, error: 'BadRequest', error_message: "Please fill a valid email address"},'one');
                    }
                }else{
                    callback(null, 'one'); // ho passto l'id utente e non lo username
                }
            },
            function(callback){

                if(oldpassword) {
                    if(id==req.User_App_Token._id){
                        tmpbody = {
                            oldpassword: oldpassword,
                            newpassword: newpassword
                        };
                        callback(null, 'two');
                    }else{
                        callback({
                            err_code:401,
                            error: "Forbidden",
                            error_message: 'you are not authorized to access this resource'
                        });

                    }
                }else {

                    var rqparams={
                        url:microserviceBaseURL+ "/tokenactions/gettokentypelist",
                        headers : {'Authorization' : "Bearer "+ microserviceTokem}
                    };

                    request.get(rqparams, function(error, response, body){

                        if(error) {
                            callback({error:'internal_App_microservice_error', error_message : error +""},"two");

                        }else{
                            var appT=JSON.parse(body).user;
                            if(_.without(appT,conf.adminUser).indexOf(req.User_App_Token.type)>=0){
                                callback({
                                    err_code:401,
                                    error: "Forbidden",
                                    error_message: 'you are not authorized to access this resource'
                                },"two");
                            }else{
                                tmpbody = {
                                    reset_token: reset_token,
                                    newpassword: newpassword
                                };
                                callback(null, 'two');
                            }
                        }
                    });
                }
            }
        ],
        function(err, results){

            if(err){
                return  res.status(err.err_code).send({error:err.error, error_message : err.error_message +""});
            }else{
                var rqparams={
                    url:microserviceBaseURL+ "/authapp/" +id+'/actions/setpassword',
                    headers : {'Authorization' : "Bearer "+ microserviceTokem,  'content-type': 'application/json'},
                    body:JSON.stringify(tmpbody)
                };


                console.log("req" + util.inspect(rqparams));

                request.post(rqparams, function(error, response, body){

                    if(error) {
                        return  res.status(500).send({error:'internal_App_microservice_error', error_message : error +""});
                    }else{
                        return  res.status(201).send({"access_credentials":JSON.parse(body)});
                    }
                });
            }
        });
});



/**
 * @api {post} /apps/:id/actions/changeuserid Change User Id(email)
 * @apiVersion 1.0.0
 * @apiName ChangeUserId
 * @apiGroup Application
 *
 * @apiDescription Accessible by admin access_token, It create a new userId(email) used to login.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String-URL} id the user id or email the identify the app
 * @apiParam {String-URL} email the new username(email) the identify the app
 *
 *
 * @apiParamExample {json} Request-Example:
 * HTTP/1.1 GET request
 *  Body:{ "email": "prov@prova.it"}
 *
 *
 * @apiSuccess (201 - Created) {String} email Contains field emial updated.

 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *        "name":"Micio",
 *        "surname":"Macio",
 *        "email": "prov@prova.it"
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 *
 */
//router.post('/:id/actions/resetpassword', [middlewares.ensureUserAdmin], function(req, res){
router.post('/:id/actions/changeuserid',[jwtMiddle.decodeToken],function(req, res,next){


    var id = (req.params.id).toString();
    req.url="/"+id;
    var body={app:req.body};
    req.body=body;
    req.method="PUT";
    try {
        router.handle(req, res,next);
    }catch (ex){
        res.status(500).send({error:"InternalError",error_message:ex.toString()});
    }
});


/**
 * @api {post} /apps/:id/actions/enable enable Application
 * @apiVersion 1.0.0
 * @apiName EnableApplication
 * @apiGroup Application
 *
 * @apiDescription Accessible by access_token, It enable the Application. To call this endpoint must have an admin token.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String} id the Application id to identify the Application
 *
 *
 *
 * @apiSuccess (201 - Created) {String} status  contains the new Application status
 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *        "status":"enabled"
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 */
router.post('/:id/actions/enable', [jwtMiddle.decodeToken], function(req, res){
    enableDisable(req,res,true);
});


/**
 * @api {post} /apps/:id/actions/disable disable Application
 * @apiVersion 1.0.0
 * @apiName DisableApplication
 * @apiGroup Application
 *
 * @apiDescription Accessible by access_token, It disable the Application. To call this endpoint must have an admin token.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String} id the Application id to identify the Application
 *
 *
 *
 * @apiSuccess (201 - Created) {String} status  contains the new Application status
 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *        "status":"disabled"
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 */
router.post('/:id/actions/disable', [jwtMiddle.decodeToken], function(req, res){
    enableDisable(req,res,false);
});


/**
 * @api {delete} /apps/:id delete Application
 * @apiVersion 1.0.0
 * @apiName Delete Application
 * @apiGroup Application
 *
 * @apiDescription Accessible by access_token, It delete Application and return the deleted resource.
 * To call this endpoint must have an admin token.
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ body || as query param || header]
 * @apiParam {String} id the Application id to identify the Application
 *
 *
 *
 * @apiSuccess (201 - Created) {String} ApplicationField_1 Contains field 1 defined in Application Schema(example name)
 * @apiSuccess (201 - Created) {String} ApplicationField_2 Contains field 2 defined in Application Schema(example notes)
 * @apiSuccess (201 - Created) {String} ApplicationField_N Contains field N defined in Application Schema(example type)
 *
 *
 * @apiSuccessExample {json} Example: 201 CREATED
 *      HTTP/1.1 204 DELETED
 *
 *     {
 *        "name":"Micio",
 *        "notes":"Macio",
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 *
 */
router.delete('/:id',[jwtMiddle.decodeToken], function(req, res) {

    var id = req.param('id').toString();

    var rqparams={
        url:microserviceBaseURL+ "/authApp/" +id,
        headers : {'Authorization' : "Bearer "+ microserviceTokem}
    };


    console.log(util.inspect(rqparams));

    request.delete(rqparams, function(error, response, body){

        if(error) {
            return  res.status(500).send({error:'internal_App_microservice_error', error_message : error +""});
        }else{
            Application.findOneAndRemove({id:id},  function(err, results){
                console.log("deleted "+util.inspect(results));
                if(!err){
                    if (results){
                        return res.status(204).send({deleted_resource:results});
                    }
                    else
                        return res.status(404).send({error:"NotFound",error_message:'no Application found with specified id'});
                }
                else{
                    return res.status(500).send({ error:"internal_error",error_message: 'something blew up, ERROR:'+err  });
                }

            });
        }
    });

});

/**
 * @api {get} /apps/:term/actions/email/find Search all Application
 * @apiVersion 1.0.0
 * @apiName SEARCH Application
 * @apiGroup Application
 *
 * @apiDescription Accessible by admin user access_token specified in config.js adminUser field. It returns the paginated list of all Application
 * that matching the search term to username.
 * To set pagination skip and limit, you can do it in the URL request, for example "get /apps?skip=10&limit=50"
 *
 *
 * @apiParam {String} access_token access_token to access to this resource. it must be sended in [ as query param || header]
 * @apiParam {String} skip start pagination
 * @apiParam {String} limit the number of elements
 *
 *
 *
 * @apiUse Metadata
 * @apiUse GetResource
 * @apiUse GetResourceExample
 *
 * @apiUse Unauthorized
 * @apiUse NotFound
 * @apiUse BadRequest
 * @apiUse ServerError
 *
 */
router.get('/:term/actions/email/find',jwtMiddle.decodeToken,function (req, res) {

    var term = req.param('term'),
        size = req.query.size ? parseInt(req.query.size) : 10,
        query = {},
        sortParams = {};

    if (!term) return res.json({'status': true, err: 1, 'message': 'term not found', data: []});

    query.email = new RegExp(term, 'i');

    Application.find(query, null, {
        limit: size,
        sort : sortParams
    }, function (err, data) {
        if (err) return res.json({'status': false, 'err': err});

        return res.json({status: true, data: data});
    });

});


module.exports = router;