let project_folder  =  require('path').basename(__dirname),
    source_folder   = 'source';
    
let fs = require('fs');

let path_file = {

    build_version   : {
        html     : project_folder + '/',
        styles   : project_folder + '/styles/',
        jscript  : project_folder + '/javascript/',
        images   : project_folder + '/images/',
        fonts    : project_folder + '/fonts/'
    },
    source_version  : {
        html     : source_folder + '/*.html',
        htmlf    : source_folder + '/html/*.html',
        styles   : source_folder + '/styles/main.scss',
        stylesf  : [source_folder + '/styles/*.scss', '!' + source_folder + '/styles/normalize.scss'],
        jscript  : source_folder + '/javascript/main.js',
        jscriptf : source_folder + '/javascript/*.js', 
        images   : source_folder + '/images/**/*.{png,jpg,svg,webp,ico,gif}',
        fonts    : source_folder + '/fonts/*.ttf'
    },
    watch           : {
        html     : source_folder + '/**/*.html',
        styles   : source_folder + '/styles/**/*.scss',
        jscript  : source_folder + '/javascript/**/*.js',
        images   : source_folder + '/images/**/*.{png,jpg,svg,webp,ico,gif}',
        fonts    : source_folder + '/fonts/**/*.{ttf,otf}'
    },
    cleaner         : './' + project_folder + '/'

};


// Variables

let {src, dest}   = require('gulp'),
    gulp          = require('gulp'),
    autoprefixer  = require('gulp-autoprefixer'), 
    browsersync   = require('browser-sync').create(),
    del           = require('del'),
    sass          = require('gulp-sass'),
    cleanCss      = require('gulp-clean-css'),
    fileInclude   = require('gulp-file-include'),
    rename        = require('gulp-rename'),
    groupQueries  = require('gulp-group-css-media-queries'),
    uglifyES      = require('gulp-uglify-es').default,
    tinypng       = require('gulp-tinypng-compress'),
    imagemin      = require('gulp-imagemin'),
    pngquant      = require('imagemin-pngquant'),
    webp          = require('gulp-webp'),
    ttf2woff      = require('gulp-ttf2woff'),
    ttf2woff2     = require('gulp-ttf2woff2'),
    fonter        = require('gulp-fonter'),
    webpack       = require('webpack'),
    webpackStream = require('webpack-stream'),
    stripComments = require('gulp-strip-comments'),
    stylelint     = require('gulp-stylelint'),
    eslint        = require('gulp-eslint'),
    htmlhint      = require('gulp-htmlhint');

// Functions

function garbageClean () {
    return del(path_file.cleaner)
}


function browserReload () {
    browsersync.init({
        server : {
            baseDir : './' + project_folder + '/'
        },
        port: 3000,
        notify: true
    })
}


function html () {
    return src(path_file.source_version.html)
        .pipe(fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(dest(path_file.build_version.html))
        .pipe(browsersync.stream())
}
 
function htmllint () {
    return src([path_file.source_version.html, path_file.source_version.htmlf])
        .pipe(htmlhint('.htmlhintrc.json'))
        .pipe(htmlhint.reporter())
}

function csslint () {
    return src(path_file.source_version.stylesf)
        .pipe(stylelint({
            reporters: [
                {  
                    formatter: 'string',
                    console: true
                }
            ]
    }))
}

function jslint () {
    return src(path_file.source_version.jscriptf)
        .pipe(eslint())
        .pipe(eslint.format())
}



function styles () {
    return src(path_file.source_version.styles)
        .pipe(sass({
            outputStyle : 'expanded'
        }))
        .pipe(groupQueries())
        .pipe(autoprefixer({
            overrideBrowserslist : ['last 5 versions'],
            cascade : true
        }))
        .pipe(dest(path_file.build_version.styles))
        .pipe(cleanCss({
            level: {
                1: {
                    all: true,
                    normalizeUrls: false,
                    specialComments: 0,
                },
                2: {
                    restructureRules: true
                }
            }
        }))
        .pipe(rename({
            suffix : '.min'
        }))
        .pipe(dest(path_file.build_version.styles))
        .pipe(browsersync.stream())
}



function javascript () {
    return src(path_file.source_version.jscript)
        .pipe(webpackStream({
            mode: 'development',
            output: {
                filename: 'main.js',
            },
            module: {
                rules: [{
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }]
            },
        }))
        .pipe(stripComments())
        .pipe(uglifyES())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(dest(path_file.build_version.jscript))
        .pipe(browsersync.stream())
}



function tinyImages () {
    return src(path_file.source_version.images)
        .pipe(tinypng({
            key: 'GGL44Z92Bg62kH1VzpDsb12W8q4G8fzS',
            sigFile: 'images/.tinypng-sigs',
            log: true
        }))
        .pipe(path_file.build_version.images)
}


function images () {
    return src(path_file.source_version.images)
        .pipe(webp({
            quality : 70
        }))
        .pipe(dest(path_file.build_version.images))
        .pipe(src(path_file.source_version.images))
        .pipe(imagemin([
            imagemin.mozjpeg({
                quality: 50
            }),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            }),
            imagemin.gifsicle({interlaced: true}),
            pngquant({
                quality : [0.2,0.4]
            })
        ], {
            progressive : true,
            interlaced : true
        }))
        .pipe(dest(path_file.build_version.images))
        .pipe(browsersync.stream())
}


function otf2 () {
    return src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats : ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts/'))
}

function fonts () {
    return src(path_file.source_version.fonts) 
        .pipe(ttf2woff())
        .pipe(dest(path_file.build_version.fonts))
        .pipe(src(path_file.source_version.fonts))
        .pipe(ttf2woff2())
        .pipe(dest(path_file.build_version.fonts))
        .pipe(browsersync.stream())
}


function watchFiles () { 
    gulp.watch([path_file.watch.html] , html)
    gulp.watch([path_file.watch.styles] , styles)
    gulp.watch([path_file.watch.jscript] , javascript)
    gulp.watch([path_file.watch.images] , images)
    gulp.watch([path_file.watch.fonts], fonts)
}


let build = gulp.series(garbageClean,  gulp.parallel(html, styles, javascript, images, fonts));
let watch = gulp.parallel(build, watchFiles, browserReload);


exports.html       = html;
exports.styles     = styles;
exports.htmllint   = htmllint;
exports.csslint    = csslint;
exports.jslint     = jslint;
exports.otf2       = otf2;
exports.tinyImages = tinyImages;
exports.javascript = javascript;
exports.images     = images;
exports.fonts      = fonts;
exports.build      = build;
exports.watch      = watch;
exports.default    = watch;
