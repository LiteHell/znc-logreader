const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
console.log('initializing database....');
const auth = require('./auth');
var funcs = {};
funcs.create_account = () => {
    var data = {};
    console.log('id must equal with znc id, and is case-sensitive.');
    readline.question('id?', (_id) => {
        data.id = _id;
        console.log('password is shown, so please be careful.')
        readline.question('pass?', (_pw) => {
            data.password = _pw;
            auth.createAccount(data).then(() => {
                console.log('success');
            }).catch(err => {
                console.log('Oops, error occured!');
                console.error(err);
            })
        })
    });
}
funcs.change_password = () => {
    readline.question('id?', (_id) => {
        console.log('password is shown, so please be careful.')
        readline.question('pass?', (_pw) => {
            auth.changePassword(_id, _pw).then(() => {
                console.log('success');
            }).catch(err => {
                console.log('Oops, error occured!');
                console.error(err);
            })
        })
    });
};
funcs.list_ids = () => {
    auth.getIds().then((ids) => {
        console.log('ids : ');
        console.log(ids.map(v => " * " + v).join('\n'));
        console.log('-- END --');
    });
}
auth.init(require('./config.json')).then(() => {
    // TO-DO : implement other actions
    readline.question(`action? (${Object.keys(funcs).join('/')})`, (_action) => {
        if(Object.keys(funcs).indexOf(_action) == -1)
            return console.log('invalid action!');
        else funcs[_action]();
    })
});