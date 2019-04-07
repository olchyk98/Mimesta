import { createStore } from 'redux';

function resolver(state = {}, { payload, type }) {
    const a = Object.assign({}, state);

    switch(type) {
        case 'SHOW_DIALOG_MODAL':
            /*
                {
                    iconStyle: %cssstyle!>string,
                    icon: %icon!>object,
                    text: %text!>string,
                    buttons: [
                        {
                            ?color: String,
                            text: String,
                            onClick: Function
                        }
                    ]
                } || null
            */

            a.dialogModal = payload;
        break;

        default:break;
    }

    return a;
}

const store = createStore(
    resolver,
    {},
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;