var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: require.resolve('tslint-loader'),
                enforce: 'pre',
                include: path.resolve(__dirname, './src')
            },
            {
                oneOf: [
                    {
                        test: /\.tsx?$/,
                        include: path.resolve(__dirname, './src'),
                        loader: require.resolve('ts-loader')
                    },
                    {
                        test: /\.jsx?$/,
                        loader: 'babel-loader',
                        exclude: /node_modules/
                    },
                    {
                        test: /\.(scss|sass|css)$/,
                        use: [
                            'style-loader',
                            'css-loader',
                            'resolve-url-loader',
                            {
                                loader: 'sass-loader',
                                options: {
                                    sourceMap: true
                                }
                            }
                        ]
                    },
                    {
                        exclude: [/\.jsx?$/, /\.tsx?$/, /\.html$/, /\.json$/],
                        loader: require.resolve('file-loader'),
                        options: {
                            name: 'static/media/[name].[hash:8].[ext]',
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            inject: 'body'
        }),
        new CopyWebpackPlugin([
            { from: './app.json' },
            { from: './backend/**' },
            { from: './app.js' }
        ])
    ],
    devServer: {
        port: 4200,
        compress: true,
        proxy: {
            '/Apps': {
                target: 'http://localhost:10030'
            },
            '/datacloud': {
                target: 'http://localhost:10030'
            }
        },
        historyApiFallback: true
    },
    devtool: 'cheap-module-source-map'
};
