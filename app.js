const express = require('express');
const app = express();
const router = express.Router();
const { createHmac } = require('crypto');
var path = require('path');
const fs = require('fs');
const os = require("os");
const macAddress = require('macaddress');
const archiver = require('archiver');
const encrypted = require('archiver-zip-encrypted');


archiver.registerFormat('zip-encrypted', encrypted);

const networkInterfaces = os.networkInterfaces();//获取mac地址
const publicKey = 'zhuzhengwang888';

const onZip = (secret, next) => {
    const outPath = '../code.zip';
    const out = fs.createWriteStream(outPath);
    const archive = archiver.create('zip-encrypted', {
        zlib: {
            level: 8
        },
        encryptionMethod: 'aes256',
        password: secret
    });

    // 压缩文件
    archive.file('./code.json');
    // 压缩文件夹
    // archive.directory('./resources/app/code', false);
    archive.pipe(out);

    out.on('close', () => {
        console.log('压缩完成!', archive.pointer() / 1024 + 'kb');
        next(archive.pointer() / 1024 + 'kb')
    });
    archive.on('error', err => {
        console.log('压缩失败!');
        throw err;
    });
    // 打包  promise函数
    archive.finalize();
};

//渲染主页面
app.get('/app', (req, res) => {
    res.setHeader('Content-type', 'text/html')
    res.sendFile(path.join(__dirname + '/index.html'));
})

//压缩文件
app.get('/zip', (req, res) => {
    //获取到mac地址，回调方法加密压缩文件
    macAddress.one((err, addr) => {
        const hmac = createHmac('sha256', addr).update('').digest('hex').slice(0, 20);
        onZip(hmac + publicKey, (size) => {
            res.send({ success: true, message: '压缩完成，文件大小' + size })
        })
    });
})

//生成口令
app.get('/getcommand', (req, res) => {
    const { exec, spawn } = require('child_process');

    /**
     * 自动复制到剪切板
     * @param {*} content 复制的文本
     * @param {*} func callback
     */
    const getClipboard = function (content, next) {
        // exec('clip').stdin.end('biebuxin');
        // exec('echo "test foo bar" | pbcopy', function (err, stdout, stderr) {
        //     console.log(stdout);
        // });
        // const proc = spawn('pbcopy');
        // proc.stdin.write('im babasss');
        // proc.stdin.end();
        console.log(process.platform);
        if (process.platform === "darwin") {
            command = `echo ${content} | pbcopy`;
        } else if (process.platform === "win32") {
            command = `echo ${content} | clip`
        } else {
            command = `echo ${content} | xclip`
        }

        exec(command, (err, stdout, stderr) => {
            if (err || stderr)
                return next(err || new Error(stderr));
            next(null);
        });
    };

    const next = function (err) {
        if (err) {
            res.send({ success: false, message: '内部错误，请联系管理员' });
            throw err;
        }
        res.send({ success: true, message: '已复制口令，请粘贴' });
    }

    macAddress.one((err, addr) => {
        const hmac = createHmac('sha256', addr).update('').digest('hex').slice(0, 20);
        getClipboard(hmac, next);
    })
})

//删除压缩包
app.get('/deletezip', (req, res) => {
    let folderFiles = fs.readdirSync('../');
    let zipfilePaths = folderFiles.filter(file => file.endsWith('.zip')).map(file => path.resolve(__dirname, '../', file));
    if (zipfilePaths.length > 0) {
        zipfilePaths.forEach(i => {
            fs.unlinkSync(i);
        });
        res.send({ success: true, message: '删除成功' });
    } else {
        res.send({ success: true, message: '删除失败，未找到' });
    };
})

//解压缩
app.get('/unzip', (req, res) => {
    macAddress.one((err, addr) => {
        const hmac = createHmac('sha256', addr).update('').digest('hex').slice(0, 20);
        unZip({ zipFilePath: '../*.zip', tgtFilePath: '../', password: hmac + publicKey }, ({ success, message }) => {
            // res.header("Access-Control-Allow-Origin", allowOrigin);
            res.send({ success, message });
        });
    });
});

const unZip = (param, next) => {
    console.log(process);
    console.log(__dirname);
    const path27zip = process.env.NODE_ENV === 'development' ? '7zip-bin' : '../app.asar.unpacked/node_modules/7zip-bin'
    const SevenBin = require(path27zip);
    const pathTo7zip = SevenBin.path7za;
    // myStream.on('data', (data) => {
    //     console.log(`stdout: ${pathTo7zip}`);// { status: 'extracted', file: 'extracted/file.txt" }
    //     // next({ success: true, message: data.file });
    // });
    // myStream.on('progress', (progress) => {
    //     console.error(`stdprogress: ${progress}`); // { percent: 67, fileCount: 5, file: undefinded }
    // });
    // myStream.on('end', (end) => {
    //     // end of the operation, get the number of folders involved in the operation
    //     console.error(`stdend: ${end}`) // ? '4'
    //     next({ success: true, message: '解压完成' });
    // });
    // myStream.on('error', (err) => {
    //     console.error(`stderr: ${err}`);
    //     next({ success: false, message: '解压失败' });
    // });

    // const cmdStr = "7z x " + param.zipFilePath + " -o" + param.tgtFilePath + " -aoa -p" + param.password;

    const { spawn } = require('child_process');
    const task = spawn(pathTo7zip, ['x', param.zipFilePath, '-o' + param.tgtFilePath, '-aoa', '-p' + param.password]);

    task.stdout.on('data', (data) => {
        console.log(`stdout: ${data.toString()}`);
    });

    task.stderr.on('data', (data) => {
        console.error(`stderr: ${data.toString()}`);
        // next({ success: false, message: '解压失败' + data.toString() });
    });

    task.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        const msg = {
            0: '解压完成，存放目录为' + path.resolve(process.argv0, '../../'),
            2: '解压失败，密码错误',
            7: '解压失败，目标文件未找到'
        }
        next({ success: code === 0, message: msg[code] });
    });

}

app.listen(15118, () => console.log('服务器已就绪', 'http://localhost:15118/app'));



