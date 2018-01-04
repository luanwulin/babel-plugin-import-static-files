import crypto from 'crypto'
import fs from 'fs-extra';
import path from 'path';

function getHash(str) {
    return crypto
        .createHash('md5')
        .update(str, 'utf8')
        .digest('hex');
}

function getFile(state, absPath, opts) {
    const root = state.file.opts.sourceRoot || process.cwd()
    let file

    if (opts.hash === true) {
        const content = fs.readFileSync(absPath, 'utf8')
        const ext = path.extname(absPath)
        file = path.basename(absPath, ext) + '-' + getHash(content) + ext
    } else {
        file = path.sep + absPath.substr(root.length).replace(/^[\/\\]+/, '')
    }

    if (opts.baseDir) {
        let copyPath = path.sep + path.join(opts.baseDir, file).replace(/^[\/\\]+/, '')
        fs.copySync(absPath, path.join(root, copyPath))
    }

    return '/' + file
        .replace(/\\/g, '/')
        .replace(/\/{2,}/g, '/')
        .replace(/^\/+/g, '');
}

const getVariableName = (p) => {
    if (
        p.node.specifiers
        && p.node.specifiers[0]
        && p.node.specifiers[0].local
    ) {
        return p.node.specifiers[0].local.name
    }
}

export default (p, t, state, opts, absPath, calleeName) => {
    const file = getFile(state, absPath, opts);

    const uri = path.join(opts.baseUri || '', file);

    if (calleeName === 'require') {
        p.replaceWith(t.StringLiteral(uri));
        return;
    }

    const variableName = getVariableName(p);
    if (variableName) {
        p.replaceWith(
            t.variableDeclaration('const', [
                t.variableDeclarator(
                    t.identifier(variableName),
                    t.stringLiteral(uri)
                )
            ])
        );
    }

}