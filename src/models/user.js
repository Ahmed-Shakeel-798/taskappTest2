const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){throw new Error("Please provide a valid Email");}
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        validate(value){
            if(value.toUpperCase()=="PASSWORD"){
                throw new Error("password cant be password you dumb idiot");
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value){
            if(value<0){
                throw new Error("Age can't be negative");
            }
        }
    },
    avatar:{
        type: Buffer
    }
    ,
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
},{
    timestamps: true,
});

// virtual field
userSchema.virtual('tasks',{
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner',
});

//  hide data
userSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;

}

// generate auth token
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({_id: user._id.toString()},process.env.TOKEN_SECRET);
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
}

// findBycredentials
userSchema.statics.findByCredentials = async (email,password)=>{
    const user = await User.findOne({email});
    if(!user){
        throw new Error("unable to login");
    }
    const isValidPassword = await bcrypt.compare(password,user.password);
    if(!isValidPassword){
        throw new Error("unable to login");
    }
    //console.log("here");
    return user;
};

// hashing middleware
userSchema.pre('save',async function(next){
    //regular func because this binding is important
    const user = this;
    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// cascade delete
userSchema.pre('remove',async function(next){
    const user = this;
    await Task.deleteMany({owner: user._id});
    next();
});

const User = mongoose.model('User',userSchema);

module.exports = User;
//const me = new User({name: "Ahmed Shakeel",email: "myNewEmail@gmail.com",password: "red1234",age: 22});
//me.save().then((r)=>console.log(r)).catch((e)=>console.log(e));

