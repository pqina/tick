export default (filter, replacement = '') => {

    const regex = filter ? new RegExp(`[^${filter}]`, 'g') : null;

    return (value, cb) => {
        let char = String.fromCharCode(value);
        if (regex) {
            char = char.replace(regex, replacement);
        }
        cb(char);
    }
    
}

