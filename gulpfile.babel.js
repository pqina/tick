import gulp from 'gulp';
import util from 'gulp-util';
import uglify from 'gulp-uglify';
import header from 'gulp-header';
import replace from 'gulp-replace';
import sass from 'gulp-sass';
import cssnano from 'gulp-cssnano';
import fs from 'fs';
import concat from 'gulp-concat';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import sequence from 'run-sequence';
import clean from 'gulp-clean';
import inlineSVG from './inline-svg';
import rename from 'gulp-rename';
import eslint from 'gulp-eslint';
import wrap from 'gulp-wrap';
import rollup from 'rollup-stream';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import babel from 'rollup-plugin-babel';
import flatten from 'gulp-flatten';
import size from 'gulp-size';

import BrowserSync from 'browser-sync';
const browserSync = BrowserSync.create();


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const getExtensionMeta = extension => {
    const type = extension[0];
    const name = extension[1];
    const dir = `${type}-${name}`;
    const dist = `./dist/${dir}`;
    const files = `./src/extensions/${dir}`;
    const pack = `./package/${name}`;
    const title = capitalizeFirstLetter(name);

    return {
        title,
        type,
        name,
        dir,
        files,
        pack,
        file: `${type}.${name}`,
        dest: `./dist/${dir}/`
    };
};

//var VIEW_NAME = util.env.view || null;
//var VIEW_PATH = util.env.view ? '/views/' + VIEW_NAME + '/' : 'core';
//var IS_VIEW = VIEW_NAME !== null;

// get all extensions
const dirs = p =>
    fs.readdirSync(p).filter(f => fs.statSync(p + '/' + f).isDirectory());

const Extensions = [];
const types = dirs('./src/extensions');
types.forEach(type => {
    const exts = dirs('./src/extensions/' + type);
    exts.forEach(ext => {
        Extensions.push([type, ext]);
    });
});

var pkg = require('./package.json');
pkg.year = new Date().getFullYear();

var banner =
    '/*\n' +
    ' * <%= pkg.name %> v<%= pkg.version %> - <%= pkg.description %>\n' +
    ' * Copyright (c) <%= pkg.year %> <%= pkg.author.name %> - <%= pkg.homepage %>\n' +
    ' */\n';

var bannerJS = '/* eslint-disable */\n\n' + banner;

/**
 * Extension
 */
const buildExtensionStyle = extension => () => {
    const type = extension[0];
    const name = extension[1];
    const out = `tick.${type}.${name}.css`;
    const path = `./src/extensions/${type}/${name}/sass/*.scss`;
    const dest = `./dist/${type}-${name}`;

    return gulp
        .src(path)
        .pipe(sass())
        .on('error', util.log)
        .pipe(
            postcss([
                autoprefixer({
                    browsers: [
                        'last 2 versions',
                        'Explorer >= 11',
                        'iOS >= 8',
                        'Android >= 4.0'
                    ]
                })
            ])
        )
        .pipe(inlineSVG())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename(out))
        .pipe(gulp.dest(dest))
        .pipe(cssnano({ safe: true }))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(
            rename(function(path) {
                path.basename += '.min';
            })
        )
        .pipe(gulp.dest(dest))
};

const buildExtensionScript = extension => () => {
    const type = extension[0];
    const name = extension[1];

    const out = `tick.${type}.${name}.js`;
    const path = `./src/extensions/${type}/${name}/js/`;
    const entry = `${path}index.js`;
    const dest = `./tmp/${type}-${name}`;

    return rollup({
        entry,
        format: 'cjs',
        plugins: [
            babel({
                exclude: 'node_modules/**',
                babelrc: false,
                presets: [['es2015', { modules: false }]],
                plugins: [
                    'external-helpers',
                    'syntax-object-rest-spread',
                    'transform-object-rest-spread'
                ]
            })
        ]
    })
        .pipe(source('index.js', path))
        .pipe(buffer())
        .pipe(rename(out))
        .pipe(gulp.dest(dest));
};

const wrapExtensionScript = extension => () => {
    const type = extension[0];
    const name = extension[1];

    const dest = `./tmp/${type}-${name}`;
    const out = `tick.${type}.${name}.wrapped.js`;
    const path = `./tmp/${type}-${name}/tick.${type}.${name}.js`;

    return gulp
        .src([
            // wrapper start
            './src/wrapper/extension.intro.js',

            // extension
            path,

            // wrapper end
            './src/wrapper/extension.outro.js'
        ])
        .pipe(concat(out))
        .pipe(gulp.dest(dest));
};

const generateExtensionScriptVariants = extension => () => {
    const type = extension[0];
    const name = extension[1];

    const dest = `./dist/${type}-${name}`;
    const path = `./tmp/${type}-${name}/tick.${type}.${name}.wrapped.js`;

    // read wrapped version of lib
    var script = fs.readFileSync(path, 'utf8');

    // inject into variants
    return gulp
        .src('src/extensions/extension.*.*')
        .pipe(replace('__LIB__', script))
        .pipe(replace('__TYPE__', type))
        .pipe(replace('__NAME__', name))
        .pipe(header(bannerJS, { pkg: pkg }))
        .pipe(
            rename(function(path) {
                path.basename = `tick.${type}.${name}.${
                    path.basename.split('.')[1]
                }`;
            })
        )
        .pipe(gulp.dest(dest));
};

const minimizeExtensionScriptVariants = extension => () => {
    const type = extension[0];
    const name = extension[1];

    const dest = `./dist/${type}-${name}`;

    return gulp
        .src([
            //`./dist/${ type }-${ name }/tick.${ type }.${ name }.kickstart.js`,
            `./dist/${type}-${name}/tick.${type}.${name}.global.js`,
            `./dist/${type}-${name}/tick.${type}.${name}.jquery.js`
        ])
        .pipe(uglify().on('error', util.log))
        .pipe(
            rename(function(path) {
                path.basename += '.min';
            })
        )
        .pipe(header(bannerJS, { pkg: pkg }))
        .pipe(gulp.dest(dest));
};

/**
 * Extension generic build process
 */
const createExtensionTask = (extension, taskName, taskCreator) => {
    const type = extension[0];
    const name = extension[1];
    const key = `extension-${type}-${name}-${taskName}`;
    const task = taskCreator(extension);

    // create task
    gulp.task(key, task);

    return key;
};

const createExtensionTasks = (extension, tasks) =>
    tasks.map(task => {
        return createExtensionTask(extension, task[0], task[1]);
    });

const buildExtension = extension => cb => {
    const seq = createExtensionTasks(extension, [
        ['script-rollup', buildExtensionScript],
        ['script-wrap', wrapExtensionScript],
        ['script-variants', generateExtensionScriptVariants],
        ['script-minimize', minimizeExtensionScriptVariants]
    ]);

    // add styles (runs in parallel)
    seq.push(createExtensionTasks(extension, [['style', buildExtensionStyle]]));

    // add we're done callback
    seq.push(cb);

    // go!
    sequence.apply(null, seq);
};

// create gulp tasks for extensions
const tasks = Extensions.map(extension => {
    return createExtensionTask(extension, 'build', buildExtension);
});

gulp.task('extensions', tasks, () => {
    console.log('done!');
});

/**
 * Core
 */
gulp.task('lib-lint', () => {
    return gulp
        .src('./src/**/*.js')
        .pipe(
            eslint({
                configFile: './.eslintrc'
            })
        )
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('lib', () => {
    return rollup({
        entry: './src/core/js/index.js',
        format: 'cjs',
        plugins: [
            babel({
                exclude: 'node_modules/**',
                babelrc: false,
                presets: [['es2015', { modules: false }]],
                plugins: [
                    'external-helpers',
                    'syntax-object-rest-spread',
                    'transform-object-rest-spread'
                ]
            })
        ]
    })
        .pipe(source('index.js', './src/core/js/'))
        .pipe(buffer())
        .pipe(rename('tick.core.js'))
        .pipe(gulp.dest('./tmp/core'))
        .pipe(uglify().on('error', util.log))
        .pipe(size({ title: 'core', gzip: true }));
});

gulp.task('lib-wrap', ['lib'], () => {
    // wrap basic version with intro and outro so all classes are contained
    return gulp
        .src([
            // wrapper start
            './src/wrapper/core.intro.js',

            // lib
            './tmp/core/tick.core.js',

            // wrapper end
            './src/wrapper/core.outro.js'
        ])
        .pipe(concat('tick.core.wrapped.js'))
        .pipe(gulp.dest('./tmp/core'));
});

gulp.task('lib-variants', ['lib-wrap'], () => {
    // read wrapped version of lib
    var lib = fs.readFileSync('./tmp/core/tick.core.wrapped.js', 'utf8');

    // inject into variants
    return gulp
        .src('src/variants/*')
        .pipe(replace('__LIB__', lib))
        .pipe(header(bannerJS, { pkg: pkg }))
        .pipe(gulp.dest('./dist/core'));
});

gulp.task('lib-minify', ['lib-variants'], () => {
    return gulp
        .src([
            './dist/core/tick.core.global.js',
            './dist/core/tick.core.kickstart.js',
            './dist/core/tick.core.jquery.js'
        ])
        .pipe(uglify().on('error', util.log))
        .pipe(
            rename(function(path) {
                path.basename += '.min';
            })
        )
        .pipe(header(bannerJS, { pkg: pkg }))
        .pipe(gulp.dest('./dist/core'));
});

gulp.task('js-clean', () => {
    return gulp.src('./tmp', { read: false }).pipe(clean());
});

gulp.task('js-polyfill', () => {
    return gulp
        .src([
            // wrapper start
            './src/wrapper/poly.intro.js',

            // polyfills
            './src/polyfill/*.js',

            // wrapper end
            './src/wrapper/poly.outro.js'
        ])
        .pipe(concat('tick.core.polyfill.js'))
        .pipe(gulp.dest('./dist/core'));
});

gulp.task('core', ['js', 'sass'], () => {});

gulp.task('js', cb => {
    sequence(
        'lib-minify',
        'js-clean',
        'js-polyfill',
        cb
    );
});

gulp.task('sass', () => {
    return gulp
        .src('./src/core/sass/*.scss')
        .pipe(sass())
        .on('error', util.log)
        .pipe(
            postcss([
                autoprefixer({
                    browsers: [
                        'last 2 versions',
                        'Explorer >= 11',
                        'iOS >= 8',
                        'Android >= 4.0'
                    ]
                })
            ])
        )
        .pipe(inlineSVG())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename('tick.core.css'))
        .pipe(gulp.dest('./dist/core'))
        .pipe(cssnano({ safe: true }))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(
            rename(function(path) {
                path.basename += '.min';
            })
        )
        .pipe(gulp.dest('./dist/core'))
});

gulp.task('clean', ['clean-tmp', 'clean-dist']);

gulp.task('clean-tmp', () => {
    return gulp.src('./tmp', { read: false }).pipe(clean());
});

gulp.task('clean-dist', () => {
    return gulp.src('./dist', { read: false }).pipe(clean());
});



/**
 * Build / Dev / prod
 */
gulp.task('build', ['clean'], function(cb) {
    sequence(['core', 'extensions'], cb);
});

gulp.task('default', ['build'], function() {
    
    gulp.watch(['./src/**/*.js'], ['js', 'extensions']);

    gulp.watch(['./src/**/*.scss'], ['sass', 'extensions']);

});
