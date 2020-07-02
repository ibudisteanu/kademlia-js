const uuid = require('uuid')
const NextTick = require('./next-tick')

const map = {};

module.exports.setAsyncInterval = (func, time )=>{

    const id = uuid.v1();
    const timeout = NextTick( ()=>processTimeout( id), time );

    map[id] = {
        func,
        id,
        time,
        timeout,
        processing: false,
        done: false,
    }

    return id;
}

module.exports.clearAsyncInterval = (id) => {

    if (!map[id]) return;
    map[id].done = true;

}

const processTimeout = (id) => {
    try{

        if (!map[id] || map[id].done){
            delete map[id];
            return;
        }

        map[id].processing = true;
        map[id].func(()=>{

            map[id].processing = false;
            if (!map[id].done) {
                delete map[id];
                return;
            }

            NextTick( ()=>processTimeout( id), map[id].time );

        })


    }catch(err){

    }
}
