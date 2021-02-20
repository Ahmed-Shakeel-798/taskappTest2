const mongoose = require("mongoose");

mongoose.connect(process.env.ROBO3T,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
});

