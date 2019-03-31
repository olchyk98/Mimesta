import { createStore } from 'redux';

function resolver(state = {}, { payload, type }) {
    const a = Object.assign({}, state);

    switch(type) {
        default:break;
    }

    return a;
}

const store = createStore(resolver);

export default store;