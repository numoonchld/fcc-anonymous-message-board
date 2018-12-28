/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var server = require('../server');

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

const MongoClient = require('mongodb').MongoClient;
const CONNECTION_STRING = process.env.DB;

const txtgen = require('txtgen');
const shortid = require('shortid');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() { 
   
    suite('THREAD - POST', function() {
      
      test('Test Creating A Thread using POST with all required fields : ',function(done){
        
        chai.request(server)
          .post('/api/threads/messageBoard')
          .send(
            {
              board: 'messageBoard',
              text: 'API thread testing - POST test: ' + txtgen.paragraph(),
              delete_password: shortid.generate().substr(0,4)
            }
          )
          .end(function(err,res){
            
            // console.log("CHAI: ",res.body);
            assert.equal(res.status, 200);
            assert.include(['new thread created','similar thread exists, new thread not created'],res.body.message);
            done();
             
          })
        
      });
      
      test('Test Creating A Thread using POST with missing required fields : ',function(done){
        
        chai.request(server)
          .post('/api/threads/messageBoard')
          .send(
            {
              board: 'messageBoard',
              text: 'API thread testing - POST test: ' + txtgen.paragraph()              
            }
          )
          .end(function(err,res){
            
            // console.log("CHAI: ",res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'enter all required fields');
            done();
             
          })
        
      });

    }); 
    
    suite('THREAD - GET', function() {
      
      test('Test getting 10 most recent threads with replies trimmed to the latest three with GET: ',function(done){
        
        chai.request(server)
          .get('/api/threads/messageBoard')
          .query(
            {
              board: 'messageBoard'
            }
          )
          .end(function(err,res){
            
            // console.log("CHAI: ",res.body);
          
            MongoClient.connect(CONNECTION_STRING, function(err,dbtest){
              
              dbtest.collection('messageBoard').find({}).toArray(function(err,retArr){
                
                assert.equal(res.status, 200);
                assert.isAtMost(res.body.length, 10);
                done();
                
                dbtest.close();
              });
              
            });
 
          })
        
      });
      
    });
    
    suite('THREAD - DELETE', function() {
      
      test('To DELETE a thread when the message board name, thread ID and delete password are provided:', function(done){
        
        MongoClient.connect(CONNECTION_STRING, function(err,dbtest){
          
          if (err)  { console.error(err)  }
          else {
            
            // console.log('connected to db for testing');
            
            dbtest.collection('messageBoard').find({}).toArray(function(err,retArr){
                
              if (err) { console.error(err) }
              else { 
                
                // console.log('docs in db: ', retArr.length)
                let docIndToDel = Math.floor(Math.random()*retArr.length);
              
                // console.log('retArr: ', retArr[docIndToDel])
              
                chai.request(server)
                  .delete('/api/threads/messageBoard')
                  .send(
                    {
                      board: 'messageBoard',
                      thread_id: retArr[docIndToDel]._id.toString(),
                      delete_password: retArr[docIndToDel].delete_password
                    }
                  )
                  .end(function(err,res){
                    
                    // console.log("CHAI: ",res.body);
                    assert.equal(res.status, 200);
                    assert.equal(res.body.message, 'delete success');
                    done(); 
                    
                    dbtest.close();
                  })
                 
                
              }
            })
                                                    
          }
          
        })      
          
      })

    });
    
    suite('THREAD - PUT', function() {
      
      test('Report a thread with PUT when the thread ID is provided', function(done){
        
        MongoClient.connect(CONNECTION_STRING, function(err,dbtest){
          
          if (err)  { console.error(err)  }
          else {
            
            // console.log('connected to db for testing');
            
            dbtest.collection('messageBoard').find({}).toArray(function(err,retArr){
                
              if (err) { console.error(err) }
              else { 
                
                // console.log('docs in db: ', retArr.length)
                let docIndToRep = Math.floor(Math.random()*retArr.length);
              
                // console.log('retArr: ', retArr[docIndToRep])
      
                  chai.request(server)
                  .put('/api/threads/messageBoard')
                  .send(
                    {
                      board: 'messageBoard',
                      thread_id: retArr[docIndToRep]._id.toString()
                    }
                  )
                  .end(function(err,res){
                    
                    console.log("CHAI - thread PUT: ",res.body);
                    assert.equal(res.status,200); 
                    assert.equal(res.body.message,'thread reported successfully')
                    done();
                    dbtest.close(); 
                  })
                 
              }
              
            })
            
          }
          
        })
      
      })
      
    });

  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST - replies', function() { 
      
      test('POST a reply to a thread, when the board name, thread id and the delete password are entered', function(done){
        
        MongoClient.connect(CONNECTION_STRING, function(err,dbtest){
          
          if (err)  { console.error(err)  }
          else {
            
            // console.log('connected to db for testing');
            
            dbtest.collection('messageBoard').find({}).toArray(function(err,retArr){
                
              if (err) { console.error(err) }
              else { 
                
                // console.log('docs in db: ', retArr.length)
                let docIndToRep = Math.floor(Math.random()*retArr.length);
              
                // console.log('retArr: ', retArr[docIndToRep])
                
                chai.request(server)
                .post('/api/replies/messageBoard')
                .send(
                  {
                    board: 'messageBoard',
                    thread_id: retArr[docIndToRep]._id,
                    text: txtgen.sentence() ,
                    delete_password: shortid.generate().substr(0,3)
                  }
                )
                .end(function(err,res){
                  
                  assert.equal(res.status,200);
                  // assert.equal(res.body.message, 'reply added to thread successfully, you will be redirected');
                  expect(res).to.redirect; // https://github.com/chaijs/chai-http#redirect
                  done();
                  dbtest.close();
                  
                })
                
              }
              
            })
            
          }
          
        })
        
      })
      
    });
    
    suite('GET - replies', function() {
      
      test('GET all replies in a thread, along with the thread, when board name and thread id is entered',function(done){
      
         MongoClient.connect(CONNECTION_STRING, function(err,dbtest){
          
          if (err)  { console.error(err)  }
          else {
            
            // console.log('connected to db for testing');
            dbtest.collection('messageBoard').find({}).toArray(function(err,retArr){
                
              if (err) { console.error(err) }
              else { 
                
                // console.log('docs in db: ', retArr.length)
                let docIndToRep = Math.floor(Math.random()*retArr.length);
              
                console.log('GET TEST retArr: ', retArr[docIndToRep])
          
                chai.request(server)
                .get('/api/replies/messageBoard')
                .query(
                  {
                    board: 'messageBoard',
                    thread_id: retArr[docIndToRep]._id.toString()
                  }
                )
                .end(function(err,res){
                
                  if (err) { console.error(err) }
                  else {
                    // console.log("CHAI: ", res.body);
                    assert.equal(res.status, 200);
                    assert.equal(retArr[docIndToRep].replies.length,res.body.replies.length);
                    done();
                  }
                
                })
                
              }
              
            })
            
          }
           
         })
      
      })
      
    });
    
    suite('PUT - replies', function() {
      
       test('Report individual replies with PUT, when thread ID, reply ID and board name are provided', function(done){

         MongoClient.connect(CONNECTION_STRING, function(err,dbtest){
          
          if (err)  { console.error(err)  }
          else {
            
            // console.log('connected to db for testing');
            dbtest.collection('messageBoard').find({}).toArray(function(err,retArr){
                
              if (err) { console.error(err) }
              else { 
                
                // console.log("PUT - replies - retArr A", retArr);
                let repliesArr = retArr.filter((ele) => ele.replies.length > 0);
                console.log("PUT - replies - repliesArr B", repliesArr);
                
                if (repliesArr.length > 0) {
                
                  // console.log('docs with replies in db: ', repliesArr.length)
                  let docIndToRep = Math.floor(Math.random()*repliesArr.length);

                  console.log('GET TEST repliesArr: ', repliesArr[docIndToRep])


                  console.log('---',typeof(repliesArr[docIndToRep].replies[Math.floor( Math.random()*repliesArr[docIndToRep].replies.length )].reply_id))

                  chai.request(server)
                  .put('/api/replies/messageBoard')
                  .send(
                    {
                      board: 'messageBoard',
                      thread_id: repliesArr[docIndToRep]._id.toString(), 
                      // thread_id: '5c25c516f3905034629b3838',
                      reply_id: repliesArr[docIndToRep].replies[Math.floor( Math.random()*repliesArr[docIndToRep].replies.length )].reply_id
                    }
                  )
                  .end(function(err,res){

                    if (err) { console.error(err) }
                    else {
                      // console.log("CHAI: ", res.body);
                      assert.equal(res.status, 200); 
                      assert.equal(res.body.message, 'reply reported successfully' )
                      done();
                    }

                  })
                  
                } else {
                  console.error('no threads have replies in collection');
                }
              }
              
            })
            
          }
           
         })

       })
      
    });
    
    suite('DELETE - replies', function() {
      
      test('Mark replies as deleted with DELETE when board name and thread id, reply id and reply delete password is entered',function(done){
      
         MongoClient.connect(CONNECTION_STRING, function(err,dbtest){
          
          if (err)  { console.error(err)  }
          else {
            
            // console.log('connected to db for testing');
            dbtest.collection('messageBoard').find({}).toArray(function(err,retArr){
                
              if (err) { console.error(err) }
              else { 
                
                console.log("DELETE - replies - retArr A", retArr);
                
                let repliesArr = retArr.filter((ele) => ele.replies.length > 0);
                console.log("DELETE - replies - repliesArr B", repliesArr);
                
                if (repliesArr.length > 0) {
                
                  // console.log('docs with replies in db: ', repliesArr.length)
                  let docIndToDel = Math.floor(Math.random()*repliesArr.length);
                  let repIndToDel = Math.floor( Math.random()*repliesArr[docIndToDel].replies.length);
                  
                  // console.log('PUT DELETE test repliesArr: ', repliesArr[docIndToDel]);
                  
                  chai.request(server)
                  .delete('/api/replies/messageBoard')
                  .send(
                    {
                      board: 'messageBoard',
                      thread_id: repliesArr[docIndToDel]._id.toString(), 
                      reply_id: repliesArr[docIndToDel].replies[repIndToDel].reply_id,
                      delete_password: repliesArr[docIndToDel].replies[repIndToDel].reply_delete_password
                    }
                  )
                  .end(function(err,res){
                    
                    if (err) { console.error(err) }
                    else {
                      // console.log("CHAI: ", res.body);
                      assert.equal(res.status, 200); 
                      assert.equal(res.body.message, 'reply deleted successfully' )
                      done();
                    }
                    
                  })
                  
                } else {
                  console.error('')
                }
                
                
              }
              
            })
            
          }
           
         })
      
      })
      
    });
    
  });

});
