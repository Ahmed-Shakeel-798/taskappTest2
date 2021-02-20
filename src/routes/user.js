const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const fs = require('fs');

const router = new express.Router();

router.post('/user', async (req,res)=>{
    const newUser = new User(req.body);
    try{
        await newUser.save();
        const token = await newUser.generateAuthToken();
        res.send({newUser,token}).status(201);
    }catch(e){
        res.status(400).send(e);
    }
});

router.post('/user/login',async(req,res)=>{
    try {
        const user = await User.findByCredentials(req.body.email,req.body.password);
        const token  = await user.generateAuthToken();
        res.status(200).send({user,token});
    } catch (e) {
        res.status(404).send(e);
    }

});

router.post('/user/logout',auth, async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{return token.token !== req.token});
        await req.user.save();
        res.status(200).send(req.user);
    }catch(e){
        res.status(400).send({error: "error occured"});
    }
});

router.post('/user/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send(req.user);
    }catch(e){
        res.status(400).send({error: "error occured"});
    }
});

router.get('/users/me',auth, async (req,res)=>{
    res.send(req.user).status(200);
});


router.patch('/user/me',auth,async(req,res)=>{
    
    const requestedUpdates = Object.keys(req.body);
    const allowedUpdates = ["name","email","password","age"];
    const isValid = requestedUpdates.every((update)=>allowedUpdates.includes(update));

    if(!isValid){
        return res.status(400).send("bad request");
    }

    try {
        // this one bypasses the middleware
        //const user = await User.findByIdAndUpdate(_id,req.body,{new: true, runValidators: true});
        //const user = await User.findById(_id);
        
        requestedUpdates.forEach( (update) => req.user[update] = req.body[update] );
        await req.user.save();
        res.status(200).send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/user/me', auth, async(req,res)=> {
    
    try {
        // const user = await User.findByIdAndDelete(_id);
        // if(!user){
        //     return res.status(404).send();
        // }
        await req.user.remove();
        res.status(200).send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});


// upload file

const upload = multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(png|jpeg|jpg|pdf)$/)){
            cb(new Error("please provide an image"));
        }
        cb(undefined,true);
    }
});
router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res)=>{
    req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
},(error,req,res,next)=>{
    res.status(400).send({error: error.message});
});

// delete user profile image
router.delete('/users/me/avatar',auth,async(req,res)=>{
    req.user.avatar = undefined;
    req.user.save();
    res.send();
},(error,req,res,next)=>{
    res.status(400).send({error: error.message});
});

router.get('/users/:id/avatar',async(req,res)=>{
    const user = await User.findById({_id: req.params.id});
    if(!user || !user.avatar){
        res.send({error: "No image found"});
    }
    //let buff = new Buffer.from(user.avatar,'base64');
    //fs.writeFileSync('mypdf.pdf', buff);

    res.set('Content-Type','application/pdf');
    res.send(user.avatar);
},(error,req,res,next)=>{
    res.status(400).send({error: error.message});
})

module.exports = router;



