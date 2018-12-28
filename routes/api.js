/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

const shortid = require('shortid');


const CONNECTION_STRING = process.env.DB


module.exports = function (app) {
  
  app.route('/api/threads/:board')
  
    // 6. I can GET an array of the most recent 10 bumped threads on the board with only the 
    // most recent 3 replies from /api/threads/{board}. The reported and delete_passwords fields will not be sent.
    .get(function(req,res){
    
      console.info(req.params.board);
    
      if (req.params.board === 'messageBoard') {

        MongoClient.connect(CONNECTION_STRING, function(err,db){

          if (err) {console.error(err)}
          else {
            
            console.info('connected to db');

            db.collection('messageBoard').find({}).sort({ bumped_on: -1 }).toArray( function(err,threadDocsArr) {
              
              console.log("number of threads retrieved from db: ", threadDocsArr.length);
              
              // console.log(formattedArr);
              // res.send(threadDocsArr);
              
              let formattedArr = threadDocsArr.splice(0,10);
     
              for (let threadDoc in formattedArr) {
                
                // console.log(formattedArr[threadDoc]);       
                delete formattedArr[threadDoc].delete_password;
                delete formattedArr[threadDoc].reported;
                
                // console.log(formattedArr[threadDoc].replies);
                if (formattedArr[threadDoc].replies.length > 1) {
 
                  formattedArr[threadDoc].replies.reverse(); 
                  // console.log(formattedArr[threadDoc].replies);
                  formattedArr[threadDoc].replies.splice(3); 
                  // console.log(formattedArr[threadDoc].replies);
                  
                  for (let replyIndex in formattedArr[threadDoc].replies ) {
                    delete formattedArr[threadDoc].replies[replyIndex].reply_delete_password;
                    delete formattedArr[threadDoc].replies[replyIndex].reported;
                  }
                }
                
              }
              
              // console.log(formattedArr);
              res.send(formattedArr);
              db.close();
            })
              
          }
            
        })
          
      }
        
    })
  
    // 4. I can POST a thread to a specific message board by passing form data text and delete_password to /api/threads/{board}.
    // (Recomend res.redirect to board page /b/{board}) 
    // Saved will be _id, text, created_on(date&time), bumped_on(date&time, starts same as created_on), 
    // reported(boolean), delete_password, & replies(array).
    .post(function(req,res){
      
      console.log('thread POST req body: ',req.body);

      // if ( req.params.board === req.body.board && req.params.board === 'messageBoard' && req.body.text && req.body.delete_password ) {
      if ( req.params.board === 'messageBoard' && req.body.text && req.body.delete_password ) {

        MongoClient.connect(CONNECTION_STRING, function(err,db){

          if (err) {console.error(err)}
          else {

            console.info('connected to db');

            db.collection('messageBoard').find({text:req.body.text, delete_password: req.body.delete_password }).toArray(function(err,retArr){
              if (err) {console.error(err)}
              else if (retArr.length > 0) {
                res.json({message:'similar thread exists, new thread not created'})
              } else if (retArr.length == 0) {

                db.collection('messageBoard').insertOne(
                  {
                    text:req.body.text, 
                    delete_password: req.body.delete_password,
                    created_on: new Date(), // (date&time)
                    bumped_on: new Date(), // (date&time) starts same as created_on, 
                    reported: false,//(boolean)
                    replies: [],// (array)
                    reply_count: 0
                  }, 
                  function(err,rObj){

                    if (err) {console.error(err)}
                    else if (rObj.result.ok === 1){
                      // console.log('!!!',rObj);
                      res.json({message:'new thread created'});
                      db.close()
                    } else {
                      res.status(500);
                      db.close();
                    }

                  }
                )



              }
            })

          }

        })

      }
      else { res.json({message:'enter all required fields'}); }

    })

    // 10. I can report a reply and change it's reported value to true by sending a PUT request to /api/replies/{board} 
    // and pass along the thread_id & reply_id. (Text response will be 'success')
    .put(function(req,res){

      console.info(req.body.thread_id);

      if ( req.params.board === 'messageBoard' ) {

        MongoClient.connect(CONNECTION_STRING, function(err,db){

          if (err) {console.error(err)}
          else {

            console.info('connected to db');

            db.collection('messageBoard').updateOne(
              {_id: ObjectId(req.body.thread_id)},
              { $set: {reported: true}} ,//(boolean)
              function(err,rObj){

                if (err) {console.error(err)}
                else if (rObj.result.ok === 1) {
                  res.json({message:'thread reported successfully'});
                  db.close();
                } else {
                  res.status(500);
                  db.close();
                }

              }
            );

          }

        })

      }

    })

    // 8. I can delete a thread completely if I send a DELETE request to /api/threads/{board} and pass along the thread_id & delete_password. 
    // (Text response will be 'incorrect password' or 'success')
    .delete(function(req,res){

      console.info(req.body.thread_id,req.body.delete_password);

      if (req.params.board === 'messageBoard' ) {

        MongoClient.connect(CONNECTION_STRING, function(err,db){

          if (err) {console.error(err)}
          else {

            console.info('connected to db');

            db.collection('messageBoard').deleteOne({_id: ObjectId(req.body.thread_id), delete_password: req.body.delete_password }, function(err,rObj){
              if (err) {console.error(err)}
              else if (rObj && rObj.result.ok == 1) {
                
                res.json({message: 'delete success'});
                
                db.close();
              } else {
                res.json({message: "incorrect password, wrong thread id, or thread doesn't exist"});
                db.close();
              }
            })
            
          }
        })

      }

    })
  
  app.route('/api/replies/:board')
  
    // 7. I can GET an entire thread with all it's replies from /api/replies/{board}?thread_id={thread_id}.
    // The reported and delete_passwords fields will not be sent.
    .get (function(req,res){

      // console.info(req.params.board, req.query);
      // console.log('-----',req);
      console.log('reply GET req query: ', req.query);
        
    
      if (req.params.board === 'messageBoard') {

        MongoClient.connect(CONNECTION_STRING, function(err,db){

          if (err) {console.error(err)}
          else {
            
            console.info('connected to db');
            
            db.collection('messageBoard').find({_id: ObjectId(req.query.thread_id)}).toArray(function(err,retArr){
              if(err){console.error(err)}
              else {
                
                // console.log('GET retArr: ',retArr);
                
                let formattedArr = retArr.slice()[0];
                
                delete formattedArr.reported;
                delete formattedArr.delete_password;
                
                if (formattedArr.replies.length > 0) {
                  for (let index in formattedArr.replies) {
                    delete formattedArr.replies[index].reply_delete_password;
                    delete formattedArr.replies[index].reported;
                  }
                }
                
                
                console.log(formattedArr);
                res.json(formattedArr);
                db.close();
              }
            })
            
            
              
          }
            
        })
          
      }
      
    })
  
    // 5. I can POST a reply to a thead on a specific board by passing form data text, delete_password, & thread_id to /api/replies/{board} 
    // and it will also update the bumped_on date to the comments date.(Recomend res.redirect to thread page /b/{board}/{thread_id}) 
    // In the thread's 'replies' array will be saved _id, text, created_on, delete_password, & reported.
    .post(function(req,res){

      console.info('reply POST req body: ', req.body);

      if (req.params.board === 'messageBoard' && req.body.thread_id && req.body.text && req.body.delete_password ) {

        MongoClient.connect(CONNECTION_STRING, function(err,db){

          if (err) {console.error(err)}
          else {

            console.info('connected to db');

            db.collection(req.params.board).find({_id: ObjectId(req.body.thread_id)}).toArray(function(err,retArr){


              if (err) {console.error(err)} 
              // check if the exact same reply exists in the thread, if no, then add, else return same reply exists. 
              else if (retArr[0].replies.indexOf(req.body.text) == -1) {

                console.log(retArr);

                db.collection(req.params.board).update(

                  {_id: ObjectId(req.body.thread_id)},

                  { 
                    $push: {

                             replies: {
                                        reply_id: shortid.generate(), 
                                        reply_text: req.body.text, 
                                        reply_delete_password: req.body.delete_password,
                                        created_on: new Date(),
                                        reported: false
                                      }
                           },

                    $set: { bumped_on: new Date() },
                    $inc: { reply_count: 1}
                  }, 

                  function(err,rObj){

                    // console.log(rObj);
                    if (rObj.result.ok == 1) {  
                      // res.json({message: 'reply added to thread successfully, you will be redirected'});
                      db.close();
                      res.redirect('/b/'+ req.params.board + '/' + req.body.thread_id);
                    }

                  }

                )



              }
            })

          }

        })

      }
      else ( res.json({message: 'required fields not entered'}) )
    })

    // 11. I can report a reply and change it's reported value to true by sending a PUT request to /api/replies/{board} 
    // and pass along the thread_id & reply_id. (Text response will be 'success')
    .put(function(req,res){

      console.info('reply PUT req body: ', req.body);

      // if ( req.params.board === req.body.board && req.params.board === 'messageBoard' && req.body.thread_id && req.body.reply_id ) {
      if ( req.params.board === 'messageBoard' && req.body.thread_id && req.body.reply_id ) {

        MongoClient.connect(CONNECTION_STRING, function(err,db){

          if (err) {console.error(err)}
          else {

            console.info('connected to db');

            // https://docs.mongodb.com/manual/reference/operator/update/positional/#update-documents-in-an-array
            db.collection('messageBoard').update( 
              { 
                _id: ObjectId(req.body.thread_id),
                "replies.reply_id": req.body.reply_id
              }, 
              {
                $set: { "replies.$.reported": true } 
              },
              function(err,rObj){

                if (rObj) {
                  // console.log(rObj.result.ok);
                  if (rObj.result.ok == 1) {  
                    res.json({message: 'reply reported successfully'});
                    db.close();
                  }
                } else {console.log('update failed')}

              }
            )

          }

        })

      }


    })

    // 9. I can delete a post(just changing the text to '[deleted]') if I send a DELETE request to /api/replies/{board} 
    // and pass along the thread_id, reply_id, & delete_password. (Text response will be 'incorrect password' or 'success')  
    .delete(function(req,res){

      console.info('reply DELETE req body: ', req.body);

      if (req.params.board === 'messageBoard' ) {

        MongoClient.connect(CONNECTION_STRING, function(err,db){

          if (err) {console.error(err)}
          else {

            console.info('connected to db');

            db.collection('messageBoard').updateOne(

              {
                _id: ObjectId(req.body.thread_id),
                "replies.reply_id": req.body.reply_id,
                "replies.reply_delete_password": req.body.delete_password
              },

              {
                $set: { 
                        "replies.$.reply_text": '[deleted]',
                        "replies.$.reply_delete_password": null
                      } 
              },

              function(err,rObj){

                if (err) { console.error(err) }
                else if (rObj && rObj.result.ok == 1) {

                  res.json({message:"reply deleted successfully"});
                  db.close();

                } else {
                  
                  res.json({message:"reply deleted failed"});
                  db.close();
                
                }

              }
            )

          }

        })

      }

    })
  
};
