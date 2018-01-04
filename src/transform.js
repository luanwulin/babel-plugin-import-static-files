import crypto from 'crypto'
import fs from 'fs-extra';
import path from 'path';
import urljoin from 'url-join';

function getHash(str) {
    return crypto
        .createHash('sha1')
        .update(str, 'utf8')
        .digest('hex')
        .slice(0, 8);
}

function getFile(state, absPath, opts) {
    const root = (opts.replaceExtendDir ? path.join(state.file.opts.sourceRoot, opts.replaceExtendDir) : state.file.opts.sourceRoot) || process.cwd();
    let file = absPath.replace(root, '');

    if (opts.baseDir) {
        let copyPath = path.join(opts.baseDir, file);
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
    let hash = '';

    if (opts.hash === true) {
        const content = fs.readFileSync(absPath, 'utf8').trim();
        hash = '?' + getHash(content);
    }

    const uri = urljoin(opts.baseUri || '', file, hash);

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