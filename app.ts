import * as Favicon from 'serve-favicon';
import * as Express from 'express';
import { AddressInfo } from 'net';
import * as Path from 'path';

import ROUTES from './routes/index';
import API from './routes/api/index';
import emailRoutes from './src/routes/emailRoutes';

import express = require('express');
import bodyParser = require('body-parser');
import ActiveDirectory = require('activedirectory2');

interface HttpError extends Error {
	status?: number;
}

const APP = Express();

require('express-file-logger')(APP, {
	basePath: 'logs',
	fileName: 'access.log',
	showOnConsole: false
});

/*
// Middleware para processar o corpo da requisição
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));

// Rota de login
APP.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Aqui você pode adicionar a lógica de verificação real, como consultar um banco de dados
    if (username === 'admin' && password === 'intervipwifi') {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});
*/
// Configurações do Active Directory
const config = {
    url: 'ldap://10.254.1.12',  // IP do servidor AD
	baseDN: 'dc=ivp,dc=net,dc=br',
    username: 'administrator', // Conta de administrador ou de serviço
    password: '4c*@DCrb23'      // Senha do administrador
};

// Criar instância do Active Directory
const ad = new ActiveDirectory(config);

APP.use(bodyParser.json());
APP.use(bodyParser.urlencoded({ extended: true }));

// Endpoint de login
APP.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Formatar o nome de usuário para o formato UPN (User Principal Name)
    const userPrincipalName = `${username}@ivp.net.br`; // domínio
    
    // Autenticar o usuário com o AD
	ad.authenticate(userPrincipalName, password, (err, auth) => {
		if (err) {
			console.error('Erro de autenticação:', err);
			console.error('Detalhes do erro:', err.lde_message);
			return res.json({ success: false, message: 'Erro de autenticação' });
		}
        
        if (auth) {
            console.log('Usuário autenticado com sucesso');
            res.json({ success: true });
        } else {
            console.log('Falha na autenticação');
            res.json({ success: false, message: 'Credenciais inválidas' });
        }
    });
});


// view engine setup
APP.set('views', Path.join(__dirname, 'views'));
APP.use(Express.static(Path.join(__dirname, 'public')));
APP.use(Express.json());

// defining routes
APP.use('/', ROUTES);
APP.use('/api', API);
APP.use('/lead', ROUTES);
APP.use('/main', ROUTES);
APP.use('/e-mails', ROUTES);
APP.use('/api/email', emailRoutes);
APP.use('/clientes-online', ROUTES);
APP.use('/teste-de-lentidao', ROUTES);
APP.use('/problemas-com-VPN', ROUTES);
APP.use('/cadastro-de-blocos', ROUTES);
APP.use('/consulta-de-planos', ROUTES);
APP.use('/cadastro-de-vendas', ROUTES);
APP.use('/problemas-sites-e-APP', ROUTES);
APP.use('/cadastro-de-viabilidade', ROUTES);
APP.use('/pedidos-linha-telefonica', ROUTES);
APP.use('/problemas-linha-telefonica', ROUTES);
APP.use('/pedidos-linha-telefonica-URA', ROUTES);

// serving a favicon file
APP.use(Favicon(Path.join(__dirname, 'public', 'images', 'favicon.ico')));

// catch 404 and forward to error handler
APP.use((_request, _response, next) => {
	var e = new Error('Not Found');
	e['status'] = 404;
	next(e);
});

// error handlers
APP.use((e: HttpError, _req: any, res: any, _next: any) => {
	if (e.status == 404) {
		res.status(e.status || 500);
		res.sendFile('not-found.html', { root: 'views' });
	}

	else {
		res.status(500);
		res.sendFile('internal-error.html', { root: 'views' });
	}
});

const server = APP.listen(8080, '127.0.0.1', function() {
	console.log(`Express server listening on localhost:${(server.address() as AddressInfo).port}`);
});

