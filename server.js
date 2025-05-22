require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Adicione este bloco para garantir fetch global:
if (!global.fetch) {
    global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy IMDb Movies
app.get('/api/imdb/top250-movies', async (req, res) => {
    try {
        const response = await fetch('https://imdb236.p.rapidapi.com/api/imdb/top250-movies', {
            headers: {
                'x-rapidapi-key': process.env.IMDB_API_KEY,
                'x-rapidapi-host': 'imdb236.p.rapidapi.com'
            }
        });
        const data = await response.json();
        console.log('Resposta da API IMDb:', data); // Adicione esta linha
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar filmes:', error); // Adicione esta linha
        res.status(500).json({ error: 'Erro ao buscar filmes.' });
    }
});

// Proxy IMDb Series
app.get('/api/imdb/top250-tv', async (req, res) => {
    try {
        const response = await fetch('https://imdb236.p.rapidapi.com/api/imdb/top250-tv', {
            headers: {
                'x-rapidapi-key': process.env.IMDB_API_KEY,
                'x-rapidapi-host': 'imdb236.p.rapidapi.com'
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar séries.' });
    }
});

// Proxy TMDB
app.get('/api/tmdb/search', async (req, res) => {
    const { type, query } = req.query;
    try {
        const url = `https://api.themoviedb.org/3/search/${type}?api_key=${process.env.TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar na TMDB.' });
    }
});

// Proxy Deep Translate
app.post('/api/translate', async (req, res) => {
    const { text, source, target } = req.body;
    try {
        const response = await fetch('https://deep-translate1.p.rapidapi.com/language/translate/v2', {
            method: 'POST',
            headers: {
                'x-rapidapi-key': process.env.DEEP_TRANSLATE_API_KEY,
                'x-rapidapi-host': 'deep-translate1.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: text, source, target })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao traduzir.' });
    }
});

// SPA fallback para index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));