// URLs das APIs do backend
const movieUrl = '/api/imdb/top250-movies';
const seriesUrl = '/api/imdb/top250-tv';

// Dicionário de tradução de gêneros
const genreDictionary = {
    "Crime": "Crime",
    "Drama": "Drama",
    "Action": "Ação",
    "Adventure": "Aventura",
    "Comedy": "Comédia",
    "Biography": "Biografia",
    "Fantasy": "Fantasia",
    "Horror": "Terror",
    "Mystery": "Mistério",
    "Romance": "Romance",
    "Sci-Fi": "Ficção Científica",
    "Thriller": "Suspense",
    "Animation": "Animação",
    "Family": "Família",
    "History": "História",
    "Music": "Música",
    "War": "Guerra",
    "Western": "Faroeste",
    "Sport": "Esporte",
    "Documentary": "Documentário"
};

// Função para traduzir gêneros usando o dicionário
function traduzirGenerosManualmente(generos) {
    return generos.map(genre => genreDictionary[genre] || genre);
}

// Função para traduzir descrição usando Deep Translate via backend
async function traduzirDescricaoDeepTranslate(textoIngles) {
    const url = '/api/translate';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textoIngles, source: 'en', target: 'pt' })
        });
        const result = await response.json();
        return result.data.translations.translatedText;
    } catch (error) {
        console.error('Erro ao traduzir descrição:', error);
        return textoIngles;
    }
}

// Função para traduzir gêneros usando Deep Translate via backend
async function traduzirGeneros(generos) {
    const url = '/api/translate';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: generos.join(', '), source: 'en', target: 'pt' })
        });
        const result = await response.json();
        return result.data.translations.translatedText.split(', ');
    } catch (error) {
        console.error('Erro ao traduzir gêneros:', error);
        return generos;
    }
}

// Função para buscar nome em português na TMDB via backend
async function buscarNomePortuguesTMDB(nomeIngles, type) {
    const url = `/api/tmdb/search?type=${type}&query=${encodeURIComponent(nomeIngles)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                title: result.title || result.name || nomeIngles,
                description: result.overview || null
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar nome na TMDB:', error);
        return null;
    }
}

// Função para renderizar a lista filtrada (deve vir antes de qualquer uso!)
async function renderFilteredList(listId, data, searchTerm) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    const normalizedSearch = searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const filteredItems = searchTerm
        ? data.filter(item => {
            const titles = [
                item.primaryTitle,
                item.originalTitle,
                item.title,
                item.l
            ].filter(Boolean);

            return titles.some(t =>
                t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalizedSearch)
            );
        })
        : data;

    filteredItems.forEach((item) => {
        const card = document.createElement('div');
        card.classList.add('item');

        // Imagem
        const imageUrl = item.primaryImage || 'default-image.jpg';
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = item.primaryTitle || item.originalTitle || 'Título desconhecido';
        card.appendChild(imageElement);

        // Container de informações
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('item-info');

        // Título
        const title = item.primaryTitle || item.originalTitle || 'Título desconhecido';
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        infoDiv.appendChild(titleElement);

        // Ano de início e fim
        const year = item.startYear || 'Ano desconhecido';
        const endYear = item.endYear ? ` - ${item.endYear}` : '';
        const yearElement = document.createElement('p');
        yearElement.classList.add('year');
        yearElement.textContent = `${year}${endYear}`;
        infoDiv.appendChild(yearElement);

        // Descrição
        const description = item.description || 'Descrição não disponível';
        const descriptionElement = document.createElement('p');
        descriptionElement.classList.add('description');
        descriptionElement.textContent = description;
        infoDiv.appendChild(descriptionElement);

        // Gêneros
        const genres = item.genres ? item.genres.join(', ') : 'Gêneros não disponíveis';
        const genresElement = document.createElement('p');
        genresElement.textContent = `Gêneros: ${genres}`;
        infoDiv.appendChild(genresElement);

        // Botão de favoritar
        const isFavorited = favoritesData.some(fav => fav.id === item.id);
        if (isFavorited) {
            card.classList.add('favorited');
        } else {
            card.classList.remove('favorited');
        }
        const favoriteButton = document.createElement('button');
        favoriteButton.classList.add('favorite-button', 'styled-action-btn');
        if (isFavorited) favoriteButton.classList.add('favorited');
        favoriteButton.textContent = isFavorited ? '❤️' : '🤍';
        favoriteButton.addEventListener('click', () => {
            toggleFavorite(item);
            const nowFavorited = favoritesData.some(fav => fav.id === item.id);
            card.classList.toggle('favorited', nowFavorited);
            favoriteButton.classList.toggle('favorited', nowFavorited);
            favoriteButton.textContent = nowFavorited ? '❤️' : '🤍';

            console.log('listId:', listId, 'favoritesData:', favoritesData);

            if (listId === 'favorites-list') {
                renderFavorites();
            }
        });
        infoDiv.appendChild(favoriteButton);

        // Botão de assistido
        const isWatched = watchedData.some(watched => watched.id === item.id);
        if (isWatched) {
            card.classList.add('watched');
        } else {
            card.classList.remove('watched');
        }
        const watchedButton = document.createElement('button');
        watchedButton.classList.add('watched-button', 'styled-action-btn');
        if (isWatched) watchedButton.classList.add('watched');
        watchedButton.textContent = isWatched ? '👁️' : '👁‍🗨';
        watchedButton.addEventListener('click', () => {
            toggleWatched(item);
            const nowWatched = watchedData.some(watched => watched.id === item.id);
            card.classList.toggle('watched', nowWatched);
            watchedButton.classList.toggle('watched', nowWatched);
            watchedButton.textContent = nowWatched ? '👁️' : '👁‍🗨';

            // Se estiver na aba de assistidos, re-renderiza a lista para sumir na hora
            if (listId === 'watched-list') {
                renderWatched();
            }
        });
        infoDiv.appendChild(watchedButton);

        // Container de botões
        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('item-buttons');

        // Botão do trailer (se existir)
        if (item.trailer) {
            const trailerLink = document.createElement('a');
            trailerLink.href = item.trailer;
            trailerLink.textContent = 'Trailer';
            trailerLink.classList.add('trailer');
            trailerLink.target = '_blank';
            buttonsDiv.appendChild(trailerLink);
        }

        // Botão do IMDb
        const imdbLink = document.createElement('a');
        imdbLink.href = item.url || '#';
        imdbLink.textContent = 'IMDb';
        imdbLink.classList.add('imdb');
        imdbLink.target = '_blank';
        buttonsDiv.appendChild(imdbLink);

        infoDiv.appendChild(buttonsDiv);
        card.appendChild(infoDiv);
        list.appendChild(card);
    });
}

// Função para buscar dados da API do IMDb via backend
async function fetchData(url, listId) {
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Agora pega o array corretamente
        const items = Array.isArray(data) ? data : [];

        const translatedData = await Promise.all(
            items.map(async (item) => {
                const tmdbData = await buscarNomePortuguesTMDB(item.primaryTitle || item.originalTitle, listId === 'movies-list' ? 'movie' : 'tv');
                const translatedGenres = traduzirGenerosManualmente(item.genres || []);
                return {
                    ...item,
                    primaryTitle: tmdbData?.title || item.primaryTitle,
                    description: tmdbData?.description || item.description,
                    genres: translatedGenres
                };
            })
        );

        if (listId === 'movies-list') {
            moviesData = translatedData;
        } else if (listId === 'series-list') {
            seriesData = translatedData;
        }

        renderFilteredList(listId, translatedData, '');
    } catch (error) {
        console.error('Erro ao buscar dados da API IMDb:', error);
    }
}

// Variáveis globais para dados
let moviesData = [];
let seriesData = [];
let favoritesData = [];
let watchedData = [];

// Função para adicionar/remover favoritos
function toggleFavorite(item) {
    if (!item.id) return;
    const index = favoritesData.findIndex(fav => fav.id === item.id);
    if (index === -1) {
        favoritesData.push(item);
    } else {
        favoritesData.splice(index, 1);
    }
    saveFavoritesToLocalStorage();
}

// Função para adicionar/remover assistidos
function toggleWatched(item) {
    if (!item.id) return;
    const index = watchedData.findIndex(watched => watched.id === item.id);
    if (index === -1) {
        watchedData.push(item);
    } else {
        watchedData.splice(index, 1);
    }
    saveWatchedToLocalStorage();
}

// Função para renderizar a lista de assistidos
function renderWatched() {
    const watchedList = document.getElementById('watched-list');
    const watchedSection = document.getElementById('watched');

    // Remove mensagens anteriores
    const existingMessage = document.querySelector('.watched-empty-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    watchedList.innerHTML = '';

    if (watchedData.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'Você ainda não marcou nenhum filme/série como assistido.';
        emptyMessage.classList.add('watched-empty-message');
        watchedSection.appendChild(emptyMessage);
    } else {
        renderFilteredList('watched-list', watchedData, '');
    }
}

// Função para salvar os favoritos no Local Storage
function saveFavoritesToLocalStorage() {
    localStorage.setItem('favorites', JSON.stringify(favoritesData));
}

// Função para salvar os assistidos no Local Storage
function saveWatchedToLocalStorage() {
    localStorage.setItem('watched', JSON.stringify(watchedData));
}

// Função para renderizar favoritos (fora do DOMContentLoaded!)
function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    const favoritesSection = document.getElementById('favorites');

    // Remove mensagens anteriores
    const existingMessage = document.querySelector('.favorites-empty-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    favoritesList.innerHTML = '';

    if (favoritesData.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'Você ainda não favoritou nenhum filme/série.';
        emptyMessage.classList.add('favorites-empty-message');
        favoritesSection.appendChild(emptyMessage);
    } else {
        renderFilteredList('favorites-list', favoritesData, '');
    }
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const moviesSection = document.getElementById('movies');
    const seriesSection = document.getElementById('series');
    const favoritesSection = document.getElementById('favorites');
    const watchedSection = document.getElementById('watched');
    const contentSelect = document.getElementById('content-select');
    const favoritesButton = document.getElementById('favorites-button');
    const watchedButton = document.getElementById('watched-button');
    const backButton = document.getElementById('back-button');
    const backButtonWatched = document.getElementById('back-button-watched');
    const contentSections = document.querySelectorAll('.content-section');
    const diceButton = document.getElementById('dice-button');

    // Função para carregar os favoritos do Local Storage
    function loadFavoritesFromLocalStorage() {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
            favoritesData = JSON.parse(storedFavorites);
        }
    }

    // Função para carregar os assistidos do Local Storage
    function loadWatchedFromLocalStorage() {
        const storedWatched = localStorage.getItem('watched');
        if (storedWatched) {
            watchedData = JSON.parse(storedWatched);
        }
    }

    // Função para alternar entre seções
    function toggleSection(sectionId) {
        contentSections.forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });
    }

    // Preencher selects de gênero
    function preencherSelectGenero(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        // Remove opções antigas (exceto "Todos os gêneros")
        select.innerHTML = '<option value="">Todos os gêneros</option>';
        Object.values(genreDictionary).forEach(genero => {
            const option = document.createElement('option');
            option.value = genero;
            option.textContent = genero;
            select.appendChild(option);
        });
    }
    preencherSelectGenero('movies-genre-select');
    preencherSelectGenero('series-genre-select');

    // Eventos de filtro de gênero
    const moviesGenreSelect = document.getElementById('movies-genre-select');
    const seriesGenreSelect = document.getElementById('series-genre-select');

    if (moviesGenreSelect) {
        moviesGenreSelect.addEventListener('change', function () {
            const selectedGenre = this.value;
            let filtered = moviesData;
            if (selectedGenre) {
                filtered = moviesData.filter(item =>
                    (item.genres || []).includes(selectedGenre)
                );
            }
            renderFilteredList('movies-list', filtered, document.getElementById('search-input').value.trim());
        });
    }

    if (seriesGenreSelect) {
        seriesGenreSelect.addEventListener('change', function () {
            const selectedGenre = this.value;
            let filtered = seriesData;
            if (selectedGenre) {
                filtered = seriesData.filter(item =>
                    (item.genres || []).includes(selectedGenre)
                );
            }
            renderFilteredList('series-list', filtered, document.getElementById('search-input').value.trim());
        });
    }

    // Atualize o filtro ao pesquisar também
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = searchInput.value.trim();
            if (document.getElementById('movies').style.display === 'block') {
                const selectedGenre = moviesGenreSelect.value;
                let filtered = moviesData;
                if (selectedGenre) {
                    filtered = moviesData.filter(item =>
                        (item.genres || []).includes(selectedGenre)
                    );
                }
                renderFilteredList('movies-list', filtered, query);
            } else if (document.getElementById('series').style.display === 'block') {
                const selectedGenre = seriesGenreSelect.value;
                let filtered = seriesData;
                if (selectedGenre) {
                    filtered = seriesData.filter(item =>
                        (item.genres || []).includes(selectedGenre)
                    );
                }
                renderFilteredList('series-list', filtered, query);
            }
        });
    }

    // Evento para o botão de favoritos
    favoritesButton.addEventListener('click', () => {
        toggleSection('favorites');
        renderFavorites();
        searchInput.value = '';
    });

    // Evento para o botão de assistidos
    watchedButton.addEventListener('click', () => {
        toggleSection('watched');
        renderWatched();
    });

    // Evento para o botão de voltar
    if (backButton) {
        backButton.addEventListener('click', () => {
            const selectedValue = contentSelect.value;
            if (selectedValue === 'movies') {
                toggleSection('movies');
                renderFilteredList('movies-list', moviesData, searchInput.value.trim());
            } else if (selectedValue === 'series') {
                toggleSection('series');
                renderFilteredList('series-list', seriesData, searchInput.value.trim());
            }
        });
    }

    // Evento de clique no botão de voltar dos assistidos
    if (backButtonWatched) {
        backButtonWatched.addEventListener('click', () => {
            // Sempre volta para filmes, mas re-renderiza para garantir atualização dos emojis
            toggleSection('movies');
            renderFilteredList('movies-list', moviesData, searchInput.value.trim());
        });
    }

    // Alterna entre filmes e séries
    contentSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        if (selectedValue === 'movies') {
            toggleSection('movies');
            if (!moviesData.length) {
                fetchData(movieUrl, 'movies-list');
            } else {
                renderFilteredList('movies-list', moviesData, '');
            }
        } else if (selectedValue === 'series') {
            toggleSection('series');
            if (!seriesData.length) {
                fetchData(seriesUrl, 'series-list');
            } else {
                renderFilteredList('series-list', seriesData, '');
            }
        }
        searchInput.value = '';
    });

    // Alternância de tema claro/escuro
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    let isLight = false;

    themeToggle.addEventListener('click', () => {
        isLight = !isLight;
        body.classList.toggle('light', isLight);
        themeToggle.textContent = isLight ? '🌞' : '🌙';
    });

    // Carregar os favoritos e assistidos ao carregar a página
    loadFavoritesFromLocalStorage();
    loadWatchedFromLocalStorage();
    renderFavorites();
    renderWatched();

    // Carrega filmes por padrão
    fetchData(movieUrl, 'movies-list');

    function highlightRandomItem() {
        // Remove destaque anterior de ambos
        document.querySelectorAll('.item.dice-highlight').forEach(el => el.classList.remove('dice-highlight'));

        // Verifica qual aba está visível
        const moviesVisible = document.getElementById('movies').style.display === 'block';
        const seriesVisible = document.getElementById('series').style.display === 'block';

        let cards;
        if (moviesVisible) {
            cards = document.querySelectorAll('#movies-list .item');
        } else if (seriesVisible) {
            cards = document.querySelectorAll('#series-list .item');
        } else {
            return;
        }

        if (!cards.length) return;
        const idx = Math.floor(Math.random() * cards.length);
        const card = cards[idx];
        card.classList.add('dice-highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    diceButton.addEventListener('click', highlightRandomItem);
});
