const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    }
},{
    timestamps: true,
});

const Task = mongoose.model("Task",taskSchema);

module.exports = Task;

// const myTask = new Task({description: "Complete this module",status: false});
// myTask.save().then((r)=>console.log(r)).catch((e)=>console.log(e));