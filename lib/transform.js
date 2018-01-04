'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getHash(str) {
    return _crypto2.default.createHash('md5').update(str, 'utf8').digest('hex');
}

function getFile(state, absPath, opts) {
    var root = state.file.opts.sourceRoot || process.cwd();
    var file = void 0;

    if (opts.hash === true) {
        var content = _fsExtra2.default.readFileSync(absPath, 'utf8');
        var ext = _path2.default.extname(absPath);
        file = _path2.default.basename(absPath, ext) + '-' + getHash(content) + ext;
    } else {
        file = _path2.default.sep + absPath.substr(root.length).replace(/^[\/\\]+/, '');
    }

    if (opts.baseDir) {
        var copyPath = _path2.default.sep + _path2.default.join(opts.baseDir, file).replace(/^[\/\\]+/, '');
        _fsExtra2.default.copySync(absPath, _path2.default.join(root, copyPath));
    }

    return '/' + file.replace(/\\/g, '/').replace(/\/{2,}/g, '/').replace(/^\/+/g, '');
}

var getVariableName = function getVariableName(p) {
    if (p.node.specifiers && p.node.specifiers[0] && p.node.specifiers[0].local) {
        return p.node.specifiers[0].local.name;
    }
};

exports.default = function (p, t, state, opts, absPath, calleeName) {
    var file = getFile(state, absPath, opts);

    var uri = '' + (opts.baseUri || '') + file;

    if (calleeName === 'require') {
        p.replaceWith(t.StringLiteral(uri));
        return;
    }

    var variableName = getVariableName(p);
    if (variableName) {
        p.replaceWith(t.variableDeclaration('const', [t.variableDeclarator(t.identifier(variableName), t.stringLiteral(uri))]));
    }
};