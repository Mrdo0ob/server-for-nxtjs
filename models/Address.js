const {Schema, model} = require('mongoose');

const schema = new Schema({
    reqAddress: {
        type: String,
        required: true
    }
});
module.exports = model('Address', schema);