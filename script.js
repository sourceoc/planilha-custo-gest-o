// ===================================================================
// PLANILHA DE CUSTOS RURAIS - Sistema Completo de Automação
// Versão: 2.0 - Sistema Expandido com Filtros, Dashboard e Relatórios
// ===================================================================

class PlanilhaCustos {
    constructor() {
        console.log('🌾 Inicializando Planilha de Custos Rurais...');
        
        // Dados da planilha
        this.costs = JSON.parse(localStorage.getItem('custos_rurais') || '[]');
        this.farmData = JSON.parse(localStorage.getItem('farm_data') || '{}');
        
        // Controles de filtros e paginação
        this.filteredCosts = [];
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.sortField = 'date';
        this.sortDirection = 'desc';
        
        // Inicializar quando DOM estiver pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        console.log('⚙️ Configurando planilha...');
        
        try {
            // Configurar formulário
            this.setupForm();
            
            // Carregar dados da fazenda
            this.loadFarmData();
            
            // Configurar data de hoje
            this.setTodayDate();
            
            // Carregar dados existentes
            this.loadData();
            
            // Configurar eventos dos filtros
            this.setupFilters();
            
            // Popular filtros de safra
            this.populateSeasonFilter();
            
            // Atualizar estatísticas do rodapé
            this.updateFooterStats();
            
            console.log('✅ Planilha inicializada com sucesso!');
            console.log(`📊 ${this.costs.length} custos carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            alert('Erro ao carregar a planilha. Recarregue a página.');
        }
    }
    
    setupForm() {
        const form = document.getElementById('costForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCost();
            });
            console.log('✅ Formulário configurado');
        } else {
            console.warn('⚠️ Formulário não encontrado');
        }
    }
    
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateField = document.getElementById('date');
        if (dateField) {
            dateField.value = today;
        }
        
        // Definir safra atual
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const season = currentMonth >= 9 || currentMonth <= 2 
            ? `${currentYear}/${currentYear + 1}` 
            : `${currentYear - 1}/${currentYear}`;
        
        const seasonField = document.getElementById('season');
        if (seasonField) {
            seasonField.value = season;
        }
    }
    
    addCost() {
        console.log('💰 Adicionando custo...');
        
        // Coletar dados do formulário
        const description = document.getElementById('description').value.trim();
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value) || 0;
        const date = document.getElementById('date').value;
        const season = document.getElementById('season').value.trim();
        const area = parseFloat(document.getElementById('area').value) || 0;
        const culture = document.getElementById('culture').value || 'geral';
        
        // Validar dados obrigatórios
        if (!description || !category || !amount || !date || !season) {
            alert('Por favor, preencha todos os campos obrigatórios (descrição, categoria, valor, data e safra).');
            return;
        }
        
        if (amount <= 0) {
            alert('O valor deve ser maior que zero.');
            return;
        }
        
            
        // Coletar campos adicionais
        const supplier = document.getElementById('supplier')?.value.trim() || '';
        const paymentMethod = document.getElementById('paymentMethod')?.value || '';
        const notes = document.getElementById('notes')?.value.trim() || '';
        
        // Criar objeto de custo expandido
        const cost = {
            id: Date.now(),
            description,
            category,
            amount,
            date,
            season,
            area,
            culture,
            supplier,
            paymentMethod,
            notes,
            costPerHectare: area > 0 ? amount / area : 0,
            createdAt: new Date().toISOString()
        };
        
        // Adicionar à lista
        this.costs.push(cost);
        
        // Salvar e atualizar
        this.saveData();
        this.loadData();
        this.clearForm();
        this.populateSeasonFilter();
        
        console.log('✅ Custo adicionado:', cost);
        this.showMessage('Custo registrado com sucesso!', 'success');
    }
    
    editCost(id) {
        const cost = this.costs.find(c => c.id === id);
        if (!cost) {
            alert('Custo não encontrado');
            return;
        }
        
        // Preencher formulário completo
        document.getElementById('description').value = cost.description;
        document.getElementById('category').value = cost.category;
        document.getElementById('amount').value = cost.amount;
        document.getElementById('date').value = cost.date;
        document.getElementById('season').value = cost.season;
        document.getElementById('area').value = cost.area || '';
        document.getElementById('culture').value = cost.culture;
        if (document.getElementById('supplier')) document.getElementById('supplier').value = cost.supplier || '';
        if (document.getElementById('paymentMethod')) document.getElementById('paymentMethod').value = cost.paymentMethod || '';
        if (document.getElementById('notes')) document.getElementById('notes').value = cost.notes || '';
        
        // Remover custo atual
        this.deleteCost(id, false);
        
        // Focar no primeiro campo
        document.getElementById('description').focus();
        this.showMessage('Custo carregado para edição', 'info');
    }
    
    deleteCost(id, confirm = true) {
        if (confirm && !window.confirm('Tem certeza que deseja excluir este custo?')) {
            return;
        }
        
        this.costs = this.costs.filter(cost => cost.id !== id);
        this.saveData();
        this.loadData();
        
        if (confirm) {
            this.showMessage('Custo excluído com sucesso', 'success');
        }
    }
    
    loadData() {
        this.applyFilters();
        this.updateDashboard();
        this.renderTable();
        this.renderCharts();
        this.updateFooterStats();
    }
    
    // ===================================================================
    // SISTEMA DE FILTROS E PESQUISA
    // ===================================================================
    
    setupFilters() {
        // Configurar eventos dos filtros
        const filterElements = [
            'searchFilter', 'categoryFilter', 'cultureFilter', 
            'seasonFilter', 'dateFromFilter', 'dateToFilter', 'minValueFilter'
        ];
        
        filterElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('input', () => this.applyFilters());
                element.addEventListener('change', () => this.applyFilters());
            }
        });
    }
    
    populateSeasonFilter() {
        const seasonFilter = document.getElementById('seasonFilter');
        if (!seasonFilter) return;
        
        // Obter safras únicas dos dados
        const seasons = [...new Set(this.costs.map(cost => cost.season))].sort().reverse();
        
        // Manter a opção "Todas as safras"
        const currentValue = seasonFilter.value;
        seasonFilter.innerHTML = '<option value="">Todas as safras</option>';
        
        seasons.forEach(season => {
            if (season) {
                const option = document.createElement('option');
                option.value = season;
                option.textContent = season;
                seasonFilter.appendChild(option);
            }
        });
        
        // Restaurar valor selecionado
        seasonFilter.value = currentValue;
    }
    
    applyFilters() {
        const search = document.getElementById('searchFilter')?.value.toLowerCase() || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const culture = document.getElementById('cultureFilter')?.value || '';
        const season = document.getElementById('seasonFilter')?.value || '';
        const dateFrom = document.getElementById('dateFromFilter')?.value || '';
        const dateTo = document.getElementById('dateToFilter')?.value || '';
        const minValue = parseFloat(document.getElementById('minValueFilter')?.value) || 0;
        
        this.filteredCosts = this.costs.filter(cost => {
            // Filtro de busca
            if (search && !cost.description.toLowerCase().includes(search) && 
                !cost.supplier?.toLowerCase().includes(search) &&
                !cost.notes?.toLowerCase().includes(search)) {
                return false;
            }
            
            // Filtro de categoria
            if (category && cost.category !== category) {
                return false;
            }
            
            // Filtro de cultura
            if (culture && cost.culture !== culture) {
                return false;
            }
            
            // Filtro de safra
            if (season && cost.season !== season) {
                return false;
            }
            
            // Filtro de data
            if (dateFrom && cost.date < dateFrom) {
                return false;
            }
            if (dateTo && cost.date > dateTo) {
                return false;
            }
            
            // Filtro de valor mínimo
            if (minValue > 0 && cost.amount < minValue) {
                return false;
            }
            
            return true;
        });
        
        // Aplicar ordenação
        this.sortFilteredCosts();
        
        // Resetar página
        this.currentPage = 1;
        
        // Atualizar interface
        this.updateFilterStats();
        this.renderTable();
    }
    
    sortFilteredCosts() {
        this.filteredCosts.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];
            
            // Tratar valores numéricos
            if (this.sortField === 'amount' || this.sortField === 'area') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }
            
            // Tratar datas
            if (this.sortField === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            // Comparar
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    updateFilterStats() {
        const filterStats = document.getElementById('filterStats');
        if (filterStats) {
            const count = this.filteredCosts.length;
            const total = this.filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
            filterStats.innerHTML = `
                <span>📊 ${count} registros encontrados</span>
                <span>💰 Total: ${this.formatCurrency(total)}</span>
            `;
        }
    }
    
    // ===================================================================
    // DASHBOARD COMPLETO COM 6 CARDS
    // ===================================================================
    
    updateDashboard() {
        const total = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const count = this.costs.length;
        
        // Card 1: Custo Total
        this.updateDashboardCard('totalCost', this.formatCurrency(total));
        this.updateDashboardCard('totalChange', this.calculateTotalChange());
        
        // Card 2: Custo por Hectare
        const farmSize = parseFloat(this.farmData.farmSize) || 0;
        const costPerHectare = farmSize > 0 ? total / farmSize : 0;
        this.updateDashboardCard('costPerHectare', this.formatCurrency(costPerHectare));
        this.updateDashboardCard('hectareChange', this.calculateHectareChange());
        
        // Card 3: Total de Registros
        this.updateDashboardCard('totalRecords', count.toString());
        this.updateDashboardCard('recordsChange', this.calculateRecordsChange());
        
        // Card 4: Maior Gasto
        const highestCost = this.costs.length > 0 ? Math.max(...this.costs.map(c => c.amount)) : 0;
        const highestCostRecord = this.costs.find(c => c.amount === highestCost);
        this.updateDashboardCard('highestCost', this.formatCurrency(highestCost));
        this.updateDashboardCard('highestCategory', highestCostRecord ? this.getCategoryName(highestCostRecord.category) : '-');
        
        // Card 5: Média Mensal
        const monthlyAverage = this.calculateMonthlyAverage();
        this.updateDashboardCard('monthlyAverage', this.formatCurrency(monthlyAverage));
        this.updateDashboardCard('monthlyChange', this.calculateMonthlyChange());
        
        // Card 6: Safra Atual
        const currentSeason = this.getCurrentSeason();
        const seasonTotal = this.calculateSeasonTotal(currentSeason);
        this.updateDashboardCard('currentSeason', currentSeason || '-');
        this.updateDashboardCard('seasonTotal', this.formatCurrency(seasonTotal));
    }
    
    updateDashboardCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
    
    calculateTotalChange() {
        const thisMonth = new Date();
        const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1);
        
        const thisMonthCosts = this.costs.filter(cost => {
            const costDate = new Date(cost.date);
            return costDate.getMonth() === thisMonth.getMonth() && 
                   costDate.getFullYear() === thisMonth.getFullYear();
        });
        
        const lastMonthCosts = this.costs.filter(cost => {
            const costDate = new Date(cost.date);
            return costDate.getMonth() === lastMonth.getMonth() && 
                   costDate.getFullYear() === lastMonth.getFullYear();
        });
        
        const thisTotal = thisMonthCosts.reduce((sum, cost) => sum + cost.amount, 0);
        const lastTotal = lastMonthCosts.reduce((sum, cost) => sum + cost.amount, 0);
        
        if (lastTotal === 0) return thisTotal > 0 ? '⬆️ Este mês' : '-';
        
        const change = ((thisTotal - lastTotal) / lastTotal) * 100;
        const icon = change > 0 ? '⬆️' : change < 0 ? '⬇️' : '➡️';
        return `${icon} ${Math.abs(change).toFixed(1)}%`;
    }
    
    calculateHectareChange() {
        return 'Por hectare da propriedade';
    }
    
    calculateRecordsChange() {
        const today = new Date();
        const thisWeek = this.costs.filter(cost => {
            const costDate = new Date(cost.date);
            const daysDiff = Math.floor((today - costDate) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7;
        }).length;
        
        return thisWeek > 0 ? `+${thisWeek} esta semana` : 'Nenhum esta semana';
    }
    
    calculateMonthlyAverage() {
        if (this.costs.length === 0) return 0;
        
        const monthTotals = {};
        this.costs.forEach(cost => {
            const date = new Date(cost.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthTotals[monthKey] = (monthTotals[monthKey] || 0) + cost.amount;
        });
        
        const months = Object.keys(monthTotals);
        if (months.length === 0) return 0;
        
        const total = Object.values(monthTotals).reduce((sum, val) => sum + val, 0);
        return total / months.length;
    }
    
    calculateMonthlyChange() {
        return 'Média dos últimos meses';
    }
    
    getCurrentSeason() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        return currentMonth >= 9 || currentMonth <= 2 
            ? `${currentYear}/${currentYear + 1}` 
            : `${currentYear - 1}/${currentYear}`;
    }
    
    calculateSeasonTotal(season) {
        if (!season) return 0;
        return this.costs
            .filter(cost => cost.season === season)
            .reduce((sum, cost) => sum + cost.amount, 0);
    }
    
    // ===================================================================
    // TABELA COM PAGINAÇÃO E ORDENAÇÃO
    // ===================================================================
    
    renderTable() {
        const tableBody = document.getElementById('costsTableBody');
        if (!tableBody) {
            console.warn('⚠️ Tabela não encontrada');
            return;
        }
        
        // Usar dados filtrados ou todos os dados
        const dataToRender = this.filteredCosts.length > 0 || this.hasActiveFilters() 
            ? this.filteredCosts 
            : this.costs;
        
        // Limpar tabela
        tableBody.innerHTML = '';
        
        if (dataToRender.length === 0) {
            const colspan = this.hasActiveFilters() ? '12' : '12';
            const message = this.hasActiveFilters() 
                ? '🔍 Nenhum resultado encontrado com os filtros aplicados.'
                : '📝 Nenhum custo cadastrado. Use o formulário acima para adicionar custos.';
            
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${colspan}" style="text-align: center; color: #666; padding: 20px;">
                        ${message}
                    </td>
                </tr>
            `;
            this.updatePaginationInfo(0, 0, 0);
            return;
        }
        
        // Calcular paginação
        const totalItems = dataToRender.length;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = this.itemsPerPage === 'all' ? totalItems : startIndex + this.itemsPerPage;
        const pageData = this.itemsPerPage === 'all' ? dataToRender : dataToRender.slice(startIndex, endIndex);
        
        // Renderizar linhas
        pageData.forEach(cost => {
            const row = document.createElement('tr');
            const costPerHa = cost.area > 0 ? this.formatCurrency(cost.amount / cost.area) : '-';
            
            row.innerHTML = `
                <td><input type="checkbox" value="${cost.id}" class="row-checkbox"></td>
                <td>${this.formatDate(cost.date)}</td>
                <td title="${cost.description}">${this.truncateText(cost.description, 30)}</td>
                <td>${this.getCategoryName(cost.category)}</td>
                <td>${cost.culture}</td>
                <td>${cost.season}</td>
                <td>${cost.area || 0}</td>
                <td class="text-right">${this.formatCurrency(cost.amount)}</td>
                <td class="text-right">${costPerHa}</td>
                <td title="${cost.supplier || ''}">${this.truncateText(cost.supplier || '-', 15)}</td>
                <td>${cost.paymentMethod || '-'}</td>
                <td>
                    <button onclick="planilha.editCost(${cost.id})" class="btn-edit" title="Editar">
                        ✏️
                    </button>
                    <button onclick="planilha.deleteCost(${cost.id})" class="btn-delete" title="Excluir">
                        🗑️
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Atualizar informações de paginação
        this.updatePaginationInfo(startIndex + 1, Math.min(endIndex, totalItems), totalItems);
        this.updatePaginationControls(totalItems);
        
        console.log(`📊 Tabela atualizada com ${pageData.length} custos (página ${this.currentPage})`);
    }
    
    hasActiveFilters() {
        const search = document.getElementById('searchFilter')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const culture = document.getElementById('cultureFilter')?.value || '';
        const season = document.getElementById('seasonFilter')?.value || '';
        const dateFrom = document.getElementById('dateFromFilter')?.value || '';
        const dateTo = document.getElementById('dateToFilter')?.value || '';
        const minValue = document.getElementById('minValueFilter')?.value || '';
        
        return search || category || culture || season || dateFrom || dateTo || minValue;
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    updatePaginationInfo(start, end, total) {
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${start}-${end} de ${total} registros`;
        }
    }
    
    updatePaginationControls(totalItems) {
        const paginationControls = document.getElementById('paginationControls');
        if (!paginationControls) return;
        
        const totalPages = this.itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Botão anterior
        html += `<button onclick="planilha.changePage(${this.currentPage - 1})" 
                        ${this.currentPage === 1 ? 'disabled' : ''}>« Anterior</button>`;
        
        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `<button onclick="planilha.changePage(${i})" 
                                ${i === this.currentPage ? 'class="active"' : ''}>${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span>...</span>';
            }
        }
        
        // Botão próximo
        html += `<button onclick="planilha.changePage(${this.currentPage + 1})" 
                        ${this.currentPage === totalPages ? 'disabled' : ''}>Próximo »</button>`;
        
        paginationControls.innerHTML = html;
    }
    
    // ===================================================================
    // SISTEMA DE GRÁFICOS (4 CHARTS)
    // ===================================================================
    
    renderCharts() {
        this.renderCategoryChart();
        this.renderMonthlyChart();
        this.renderCultureChart();
        this.renderSeasonChart();
    }
    
    renderCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Agrupar custos por categoria
        const categoryTotals = {};
        this.costs.forEach(cost => {
            const category = this.getCategoryName(cost.category);
            categoryTotals[category] = (categoryTotals[category] || 0) + cost.amount;
        });
        
        this.drawBarChart(ctx, canvas, categoryTotals, 'Custos por Categoria');
    }
    
    renderMonthlyChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Agrupar custos por mês
        const monthlyTotals = {};
        this.costs.forEach(cost => {
            const date = new Date(cost.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
            monthlyTotals[monthName] = (monthlyTotals[monthName] || 0) + cost.amount;
        });
        
        this.drawLineChart(ctx, canvas, monthlyTotals, 'Evolução Mensal');
    }
    
    renderCultureChart() {
        const canvas = document.getElementById('cultureChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Agrupar custos por cultura
        const cultureTotals = {};
        this.costs.forEach(cost => {
            const culture = cost.culture || 'Geral';
            cultureTotals[culture] = (cultureTotals[culture] || 0) + cost.amount;
        });
        
        this.drawPieChart(ctx, canvas, cultureTotals, 'Custos por Cultura');
    }
    
    renderSeasonChart() {
        const canvas = document.getElementById('seasonChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Agrupar custos por safra
        const seasonTotals = {};
        this.costs.forEach(cost => {
            const season = cost.season || 'Sem safra';
            seasonTotals[season] = (seasonTotals[season] || 0) + cost.amount;
        });
        
        this.drawBarChart(ctx, canvas, seasonTotals, 'Comparação por Safra');
    }
    
    drawBarChart(ctx, canvas, data, title) {
        if (Object.keys(data).length === 0) {
            this.drawEmptyChart(ctx, canvas, title);
            return;
        }
        
        const entries = Object.entries(data).sort(([,a], [,b]) => b - a);
        const maxValue = Math.max(...entries.map(([, value]) => value));
        const barWidth = Math.min((canvas.width - 80) / entries.length, 60);
        const startX = (canvas.width - (barWidth * entries.length)) / 2;
        
        // Título
        ctx.fillStyle = '#2d5a27';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, 25);
        
        // Barras
        entries.forEach(([label, value], index) => {
            const barHeight = (value / maxValue) * (canvas.height - 100);
            const x = startX + index * barWidth;
            const y = canvas.height - barHeight - 50;
            
            // Gradiente da barra
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, this.getBarColor(index));
            gradient.addColorStop(1, this.getBarColorDark(index));
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
            
            // Valor
            ctx.fillStyle = '#333';
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(this.formatCurrency(value, true), x + barWidth / 2, y - 8);
            
            // Label
            ctx.save();
            ctx.translate(x + barWidth / 2, canvas.height - 15);
            ctx.rotate(-Math.PI / 4);
            ctx.font = '10px Inter';
            ctx.fillText(this.truncateText(label, 12), 0, 0);
            ctx.restore();
        });
    }
    
    drawLineChart(ctx, canvas, data, title) {
        if (Object.keys(data).length === 0) {
            this.drawEmptyChart(ctx, canvas, title);
            return;
        }
        
        const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
        const values = entries.map(([, value]) => value);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue || 1;
        
        // Título
        ctx.fillStyle = '#2d5a27';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, 25);
        
        // Área do gráfico
        const chartArea = {
            left: 50,
            right: canvas.width - 30,
            top: 50,
            bottom: canvas.height - 50
        };
        
        const stepX = (chartArea.right - chartArea.left) / (entries.length - 1 || 1);
        
        // Desenhar linha
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        entries.forEach(([label, value], index) => {
            const x = chartArea.left + index * stepX;
            const y = chartArea.bottom - ((value - minValue) / range) * (chartArea.bottom - chartArea.top);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Pontos
            ctx.save();
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
            
            // Labels
            ctx.fillStyle = '#333';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(this.truncateText(label, 8), x, chartArea.bottom + 15);
            
            // Valores
            ctx.fillText(this.formatCurrency(value, true), x, y - 10);
        });
        
        ctx.stroke();
    }
    
    drawPieChart(ctx, canvas, data, title) {
        if (Object.keys(data).length === 0) {
            this.drawEmptyChart(ctx, canvas, title);
            return;
        }
        
        const entries = Object.entries(data).sort(([,a], [,b]) => b - a);
        const total = entries.reduce((sum, [, value]) => sum + value, 0);
        
        // Título
        ctx.fillStyle = '#2d5a27';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, 25);
        
        const centerX = canvas.width / 2;
        const centerY = (canvas.height + 30) / 2;
        const radius = Math.min(canvas.width, canvas.height - 80) / 3;
        
        let currentAngle = -Math.PI / 2;
        
        entries.forEach(([label, value], index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Desenhar fatia
            ctx.fillStyle = this.getBarColor(index);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            // Borda
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${((value / total) * 100).toFixed(1)}%`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
        
        // Legenda
        let legendY = centerY + radius + 30;
        entries.forEach(([label, value], index) => {
            if (legendY > canvas.height - 10) return;
            
            ctx.fillStyle = this.getBarColor(index);
            ctx.fillRect(centerX - 80, legendY - 8, 12, 12);
            
            ctx.fillStyle = '#333';
            ctx.font = '11px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`${this.truncateText(label, 15)}: ${this.formatCurrency(value, true)}`, centerX - 65, legendY + 2);
            
            legendY += 18;
        });
    }
    
    drawEmptyChart(ctx, canvas, title) {
        ctx.fillStyle = '#2d5a27';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, 25);
        
        ctx.fillStyle = '#999';
        ctx.font = '14px Inter';
        ctx.fillText('Nenhum dado para exibir', canvas.width / 2, canvas.height / 2);
    }
    
    getBarColor(index) {
        const colors = [
            '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#607D8B',
            '#795548', '#E91E63', '#00BCD4', '#8BC34A', '#FFC107', '#673AB7'
        ];
        return colors[index % colors.length];
    }
    
    getBarColorDark(index) {
        const colors = [
            '#45a049', '#1976D2', '#F57C00', '#D32F2F', '#7B1FA2', '#455A64',
            '#5D4037', '#C2185B', '#0097A7', '#689F38', '#FF8F00', '#512DA8'
        ];
        return colors[index % colors.length];
    }
    
    getCategoryName(category) {
        const categories = {
            'sementes': 'Sementes',
            'fertilizantes': 'Fertilizantes',
            'defensivos': 'Defensivos',
            'maquinas': 'Máquinas',
            'combustivel': 'Combustível',
            'mao-obra-fixa': 'Mão de Obra Fixa',
            'mao-obra-temporaria': 'Mão de Obra Temporária',
            'impostos': 'Impostos',
            'seguros': 'Seguros'
        };
        return categories[category] || category;
    }
    
    formatCurrency(value, short = false) {
        if (short && value >= 1000) {
            return `R$ ${(value / 1000).toFixed(1)}k`;
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }
    
    clearForm() {
        const form = document.getElementById('costForm');
        if (form) {
            form.reset();
            this.setTodayDate();
        }
    }
    
    saveData() {
        localStorage.setItem('custos_rurais', JSON.stringify(this.costs));
    }
    
    // ===================================================================
    // FUNCIONALIDADES AUXILIARES E MANUTENÇÃO
    // ===================================================================
    
    loadFarmData() {
        const farmName = this.farmData.farmName || '';
        const farmOwner = this.farmData.farmOwner || '';
        const farmSize = this.farmData.farmSize || '';
        const farmLocation = this.farmData.farmLocation || '';
        
        if (document.getElementById('farmName')) document.getElementById('farmName').value = farmName;
        if (document.getElementById('farmOwner')) document.getElementById('farmOwner').value = farmOwner;
        if (document.getElementById('farmSize')) document.getElementById('farmSize').value = farmSize;
        if (document.getElementById('farmLocation')) document.getElementById('farmLocation').value = farmLocation;
    }
    
    updateFooterStats() {
        const totalCosts = this.costs.length;
        const totalValue = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const lastUpdate = totalCosts > 0 ? new Date().toLocaleString('pt-BR') : '-';
        
        if (document.getElementById('footerTotalCosts')) {
            document.getElementById('footerTotalCosts').textContent = totalCosts;
        }
        if (document.getElementById('footerTotalValue')) {
            document.getElementById('footerTotalValue').textContent = this.formatCurrency(totalValue);
        }
        if (document.getElementById('lastUpdate')) {
            document.getElementById('lastUpdate').textContent = lastUpdate;
        }
    }
    
    changePage(page) {
        const dataToRender = this.filteredCosts.length > 0 || this.hasActiveFilters() 
            ? this.filteredCosts 
            : this.costs;
        const totalPages = this.itemsPerPage === 'all' ? 1 : Math.ceil(dataToRender.length / this.itemsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderTable();
    }
    
    sortTable(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.applyFilters();
        
        // Atualizar setas de ordenação
        document.querySelectorAll('.sort-arrow').forEach(arrow => {
            arrow.textContent = '↕️';
        });
        
        const activeArrow = document.querySelector(`th[onclick="sortTable('${field}')"] .sort-arrow`);
        if (activeArrow) {
            activeArrow.textContent = this.sortDirection === 'asc' ? '⬆️' : '⬇️';
        }
    }
    
    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Inter, Arial, sans-serif;
            font-weight: 500;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    // ===================================================================
    // SISTEMA DE RELATÓRIOS E MODAL
    // ===================================================================
    
    generateCategoryReport() {
        const categoryTotals = {};
        const categoryCounts = {};
        
        this.costs.forEach(cost => {
            const category = this.getCategoryName(cost.category);
            categoryTotals[category] = (categoryTotals[category] || 0) + cost.amount;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        
        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        
        let reportHTML = `
            <div class="report-content">
                <h3>Relatório Detalhado por Categoria</h3>
                <p><strong>Período:</strong> Todos os registros</p>
                <p><strong>Total Geral:</strong> ${this.formatCurrency(total)}</p>
                <br>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">Categoria</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Valor Total</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">Registros</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">% do Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, value]) => {
                const percentage = ((value / total) * 100).toFixed(1);
                const count = categoryCounts[category];
                reportHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">${category}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(value)}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${count}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${percentage}%</td>
                    </tr>
                `;
            });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        this.showModal('Relatório por Categoria', reportHTML);
    }
    
    generateCultureReport() {
        const cultureTotals = {};
        const cultureCounts = {};
        
        this.costs.forEach(cost => {
            const culture = cost.culture || 'Geral';
            cultureTotals[culture] = (cultureTotals[culture] || 0) + cost.amount;
            cultureCounts[culture] = (cultureCounts[culture] || 0) + 1;
        });
        
        const total = Object.values(cultureTotals).reduce((sum, val) => sum + val, 0);
        
        let reportHTML = `
            <div class="report-content">
                <h3>Relatório Detalhado por Cultura</h3>
                <p><strong>Total Geral:</strong> ${this.formatCurrency(total)}</p>
                <br>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">Cultura</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Valor Total</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">Registros</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Média por Registro</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.entries(cultureTotals)
            .sort(([,a], [,b]) => b - a)
            .forEach(([culture, value]) => {
                const count = cultureCounts[culture];
                const average = value / count;
                reportHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">${culture}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(value)}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${count}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(average)}</td>
                    </tr>
                `;
            });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        this.showModal('Relatório por Cultura', reportHTML);
    }
    
    generateMonthlyReport() {
        const monthlyTotals = {};
        const monthlyCounts = {};
        
        this.costs.forEach(cost => {
            const date = new Date(cost.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
            monthlyTotals[monthName] = (monthlyTotals[monthName] || 0) + cost.amount;
            monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1;
        });
        
        const total = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
        
        let reportHTML = `
            <div class="report-content">
                <h3>Relatório de Evolução Mensal</h3>
                <p><strong>Total Geral:</strong> ${this.formatCurrency(total)}</p>
                <br>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">Mês</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Valor Total</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">Registros</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Média Diária</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.entries(monthlyTotals)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .forEach(([month, value]) => {
                const count = monthlyCounts[month];
                const dailyAverage = value / 30; // Aproximação
                reportHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">${month}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(value)}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${count}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(dailyAverage)}</td>
                    </tr>
                `;
            });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        this.showModal('Relatório Mensal', reportHTML);
    }
    
    generateSeasonReport() {
        const seasonTotals = {};
        const seasonCounts = {};
        
        this.costs.forEach(cost => {
            const season = cost.season || 'Sem safra';
            seasonTotals[season] = (seasonTotals[season] || 0) + cost.amount;
            seasonCounts[season] = (seasonCounts[season] || 0) + 1;
        });
        
        const total = Object.values(seasonTotals).reduce((sum, val) => sum + val, 0);
        
        let reportHTML = `
            <div class="report-content">
                <h3>Relatório Comparativo por Safra</h3>
                <p><strong>Total Geral:</strong> ${this.formatCurrency(total)}</p>
                <br>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">Safra</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Valor Total</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">Registros</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Média por Registro</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.entries(seasonTotals)
            .sort(([a], [b]) => b.localeCompare(a))
            .forEach(([season, value]) => {
                const count = seasonCounts[season];
                const average = value / count;
                reportHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">${season}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(value)}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${count}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(average)}</td>
                    </tr>
                `;
            });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        this.showModal('Relatório por Safra', reportHTML);
    }
    
    generateFinancialReport() {
        const total = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const count = this.costs.length;
        const average = count > 0 ? total / count : 0;
        const farmSize = parseFloat(this.farmData.farmSize) || 0;
        const costPerHectare = farmSize > 0 ? total / farmSize : 0;
        
        // Maiores gastos
        const topCosts = [...this.costs]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
        
        let reportHTML = `
            <div class="report-content">
                <h3>Relatório Financeiro Completo</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <h4>Valor Total</h4>
                        <p style="font-size: 1.5em; color: #2d5a27; font-weight: bold;">${this.formatCurrency(total)}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <h4>Total de Registros</h4>
                        <p style="font-size: 1.5em; color: #2d5a27; font-weight: bold;">${count}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <h4>Média por Registro</h4>
                        <p style="font-size: 1.5em; color: #2d5a27; font-weight: bold;">${this.formatCurrency(average)}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <h4>Custo por Hectare</h4>
                        <p style="font-size: 1.5em; color: #2d5a27; font-weight: bold;">${this.formatCurrency(costPerHectare)}</p>
                    </div>
                </div>
                
                <h4>Maiores Gastos</h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Data</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Descrição</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Categoria</th>
                            <th style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        topCosts.forEach(cost => {
            reportHTML += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${this.formatDate(cost.date)}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${cost.description}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${this.getCategoryName(cost.category)}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(cost.amount)}</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        this.showModal('Relatório Financeiro', reportHTML);
    }
    
    generateTrendReport() {
        // Análise de tendência dos últimos 6 meses
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const recentCosts = this.costs.filter(cost => new Date(cost.date) >= sixMonthsAgo);
        const monthlyData = {};
        
        recentCosts.forEach(cost => {
            const date = new Date(cost.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
            
            if (!monthlyData[monthName]) {
                monthlyData[monthName] = { total: 0, count: 0 };
            }
            monthlyData[monthName].total += cost.amount;
            monthlyData[monthName].count += 1;
        });
        
        let reportHTML = `
            <div class="report-content">
                <h3>Relatório de Tendência (Últimos 6 Meses)</h3>
                <p><strong>Período analisado:</strong> ${sixMonthsAgo.toLocaleDateString('pt-BR')} até ${new Date().toLocaleDateString('pt-BR')}</p>
                <br>
                
                <h4>Evolução Mensal</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">Mês</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Total</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">Registros</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Média</th>
                            <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">Tendência</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const sortedMonths = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b));
        
        sortedMonths.forEach(([month, data], index) => {
            const average = data.total / data.count;
            let trend = '-';
            
            if (index > 0) {
                const previousData = sortedMonths[index - 1][1];
                const previousAverage = previousData.total / previousData.count;
                const change = ((average - previousAverage) / previousAverage) * 100;
                
                if (change > 5) trend = '⬆️ Crescimento';
                else if (change < -5) trend = '⬇️ Redução';
                else trend = '➡️ Estável';
            }
            
            reportHTML += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #dee2e6;">${month}</td>
                    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(data.total)}</td>
                    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${data.count}</td>
                    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${this.formatCurrency(average)}</td>
                    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${trend}</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
                
                <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                    <h4>Resumo da Tendência</h4>
                    <p><strong>Total no período:</strong> ${this.formatCurrency(recentCosts.reduce((sum, c) => sum + c.amount, 0))}</p>
                    <p><strong>Média mensal:</strong> ${this.formatCurrency(recentCosts.reduce((sum, c) => sum + c.amount, 0) / 6)}</p>
                    <p><strong>Registros no período:</strong> ${recentCosts.length}</p>
                </div>
            </div>
        `;
        
        this.showModal('Relatório de Tendência', reportHTML);
    }
    
    showModal(title, content) {
        const modal = document.getElementById('reportModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            modal.style.display = 'block';
        }
    }
    
    // Função para exportar dados para CSV
    exportToCSV() {
        const dataToExport = this.hasActiveFilters() && this.filteredCosts.length > 0 
            ? this.filteredCosts 
            : this.costs;
            
        if (dataToExport.length === 0) {
            alert('Nenhum dado para exportar');
            return;
        }
        
        const headers = [
            'Data', 'Descrição', 'Categoria', 'Valor', 'Área', 'Cultura', 
            'Safra', 'Fornecedor', 'Forma de Pagamento', 'Observações'
        ];
        
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(cost => [
                cost.date,
                `"${cost.description}"`,
                `"${this.getCategoryName(cost.category)}"`,
                cost.amount,
                cost.area || 0,
                cost.culture,
                cost.season,
                `"${cost.supplier || ''}"`,
                cost.paymentMethod || '',
                `"${cost.notes || ''}"`
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custos-rurais-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Dados exportados com sucesso!', 'success');
    }
}

// ===================================================================
// FUNÇÕES GLOBAIS PARA COMPATIBILIDADE COM HTML
// ===================================================================

// Funções de filtros
function clearFilters() {
    if (window.planilha) {
        document.getElementById('searchFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('cultureFilter').value = '';
        document.getElementById('seasonFilter').value = '';
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';
        document.getElementById('minValueFilter').value = '';
        window.planilha.applyFilters();
    }
}

function saveFilters() {
    if (window.planilha) {
        const filters = {
            search: document.getElementById('searchFilter').value,
            category: document.getElementById('categoryFilter').value,
            culture: document.getElementById('cultureFilter').value,
            season: document.getElementById('seasonFilter').value,
            dateFrom: document.getElementById('dateFromFilter').value,
            dateTo: document.getElementById('dateToFilter').value,
            minValue: document.getElementById('minValueFilter').value
        };
        localStorage.setItem('saved_filters', JSON.stringify(filters));
        window.planilha.showMessage('Filtros salvos com sucesso!', 'success');
    }
}

function applyFilters() {
    if (window.planilha) {
        window.planilha.applyFilters();
    }
}

// Funções de exportação
function exportToCSV() {
    if (window.planilha) {
        window.planilha.exportToCSV();
    }
}

function exportToPDF() {
    if (window.planilha) {
        window.planilha.generateFinancialReport();
    }
}

// Funções de dados da fazenda
function updateFarmData() {
    if (window.planilha) {
        const farmData = {
            farmName: document.getElementById('farmName').value,
            farmOwner: document.getElementById('farmOwner').value,
            farmSize: document.getElementById('farmSize').value,
            farmLocation: document.getElementById('farmLocation').value
        };
        window.planilha.farmData = farmData;
        localStorage.setItem('farm_data', JSON.stringify(farmData));
        window.planilha.updateDashboard();
    }
}

// Funções de tabela
function sortTable(field) {
    if (window.planilha) {
        window.planilha.sortTable(field);
    }
}

function changePage(page) {
    if (window.planilha) {
        window.planilha.changePage(page);
    }
}

function changeItemsPerPage() {
    if (window.planilha) {
        const select = document.getElementById('itemsPerPage');
        window.planilha.itemsPerPage = select.value === 'all' ? 'all' : parseInt(select.value);
        window.planilha.currentPage = 1;
        window.planilha.renderTable();
    }
}

function selectAll() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
}

function deleteSelected() {
    if (window.planilha) {
        const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
            .map(cb => parseInt(cb.value));
        
        if (selectedIds.length === 0) {
            alert('Selecione pelo menos um item para excluir');
            return;
        }
        
        if (confirm(`Tem certeza que deseja excluir ${selectedIds.length} item(ns)?`)) {
            selectedIds.forEach(id => {
                window.planilha.costs = window.planilha.costs.filter(cost => cost.id !== id);
            });
            window.planilha.saveData();
            window.planilha.loadData();
            window.planilha.showMessage(`${selectedIds.length} item(ns) excluído(s)`, 'success');
            document.getElementById('selectAllCheckbox').checked = false;
        }
    }
}

function exportSelected() {
    if (window.planilha) {
        const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
            .map(cb => parseInt(cb.value));
        
        if (selectedIds.length === 0) {
            alert('Selecione pelo menos um item para exportar');
            return;
        }
        
        const selectedCosts = window.planilha.costs.filter(cost => selectedIds.includes(cost.id));
        
        // Exportar selecionados como CSV
        const headers = [
            'Data', 'Descrição', 'Categoria', 'Valor', 'Área', 'Cultura', 
            'Safra', 'Fornecedor', 'Forma de Pagamento', 'Observações'
        ];
        
        const csvContent = [
            headers.join(','),
            ...selectedCosts.map(cost => [
                cost.date,
                `"${cost.description}"`,
                `"${window.planilha.getCategoryName(cost.category)}"`,
                cost.amount,
                cost.area || 0,
                cost.culture,
                cost.season,
                `"${cost.supplier || ''}"`,
                cost.paymentMethod || '',
                `"${cost.notes || ''}"`
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custos-selecionados-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.planilha.showMessage(`${selectedIds.length} item(ns) exportado(s)`, 'success');
    }
}

// Funções de formulário
function setTodayDate() {
    if (window.planilha) {
        window.planilha.setTodayDate();
    }
}

function duplicateLastEntry() {
    if (window.planilha && window.planilha.costs.length > 0) {
        const lastCost = window.planilha.costs[window.planilha.costs.length - 1];
        
        document.getElementById('description').value = lastCost.description;
        document.getElementById('category').value = lastCost.category;
        document.getElementById('culture').value = lastCost.culture;
        if (document.getElementById('supplier')) document.getElementById('supplier').value = lastCost.supplier || '';
        if (document.getElementById('paymentMethod')) document.getElementById('paymentMethod').value = lastCost.paymentMethod || '';
        if (document.getElementById('notes')) document.getElementById('notes').value = lastCost.notes || '';
        
        window.planilha.setTodayDate();
        window.planilha.showMessage('Dados do último registro carregados', 'info');
    }
}

// Funções de relatórios
function generateCategoryReport() {
    if (window.planilha) {
        window.planilha.generateCategoryReport();
    }
}

function generateCultureReport() {
    if (window.planilha) {
        window.planilha.generateCultureReport();
    }
}

function generateMonthlyReport() {
    if (window.planilha) {
        window.planilha.generateMonthlyReport();
    }
}

function generateSeasonReport() {
    if (window.planilha) {
        window.planilha.generateSeasonReport();
    }
}

function generateFinancialReport() {
    if (window.planilha) {
        window.planilha.generateFinancialReport();
    }
}

function generateTrendReport() {
    if (window.planilha) {
        window.planilha.generateTrendReport();
    }
}

// Funções de modal
function closeModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function printReport() {
    window.print();
}

function exportReportPDF() {
    window.planilha.showMessage('Funcionalidade de PDF em desenvolvimento', 'info');
}

// Funções de limpeza
function clearAllData() {
    if (confirm('ATENÇÃO: Esta ação irá excluir TODOS os dados permanentemente. Tem certeza?')) {
        if (confirm('Esta é sua última chance! Todos os custos serão perdidos. Continuar?')) {
            localStorage.removeItem('custos_rurais');
            localStorage.removeItem('farm_data');
            localStorage.removeItem('saved_filters');
            window.location.reload();
        }
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Inicializar planilha
let planilha = null;

// CSS adicional para melhorias
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .btn-edit, .btn-delete {
        padding: 6px 10px;
        margin: 0 2px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .btn-edit {
        background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
    }
    
    .btn-delete {
        background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
    }
    
    .btn-edit:hover {
        background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
    }
    
    .btn-delete:hover {
        background: linear-gradient(135deg, #D32F2F 0%, #C62828 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
    }
    
    .report-content {
        line-height: 1.6;
    }
    
    .report-content h3 {
        color: #2d5a27;
        margin-bottom: 15px;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 10px;
    }
    
    .report-content h4 {
        color: #2d5a27;
        margin: 20px 0 10px 0;
    }
    
    .row-checkbox {
        transform: scale(1.2);
        margin: 0;
    }
    
    .text-right {
        text-align: right;
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    
    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #4CAF50;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

document.head.appendChild(additionalStyles);

// ===================================================================
// INICIALIZAÇÃO DO SISTEMA
// ===================================================================

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌾 Iniciando Sistema de Planilha de Custos Rurais...');
    
    // Mostrar loading
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);
    
    setTimeout(() => {
        try {
            planilha = new PlanilhaCustos();
            window.planilha = planilha; // Disponibilizar globalmente
            
            // Carregar filtros salvos
            const savedFilters = localStorage.getItem('saved_filters');
            if (savedFilters) {
                const filters = JSON.parse(savedFilters);
                Object.entries(filters).forEach(([key, value]) => {
                    const elementId = key === 'search' ? 'searchFilter' : 
                                     key === 'dateFrom' ? 'dateFromFilter' :
                                     key === 'dateTo' ? 'dateToFilter' :
                                     key === 'minValue' ? 'minValueFilter' :
                                     key + 'Filter';
                    const element = document.getElementById(elementId);
                    if (element && value) {
                        element.value = value;
                    }
                });
            }
            
            // Remover loading
            document.body.removeChild(loadingOverlay);
            
            console.log('✅ Sistema iniciado com sucesso!');
            console.log(`📊 ${planilha.costs.length} custos carregados`);
            
            // Mostrar mensagem de boas-vindas se for a primeira vez
            if (planilha.costs.length === 0) {
                setTimeout(() => {
                    planilha.showMessage('Bem-vindo! Comece adicionando informações da sua propriedade e registrando seus custos.', 'info');
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema:', error);
            document.body.removeChild(loadingOverlay);
            alert('Erro ao carregar o sistema. Recarregue a página.');
        }
    }, 500);
});

console.log('📋 Sistema de Planilha de Custos Rurais - V2.0 - Carregado com Sucesso!');
console.log('🌾 Recursos: Dashboard, Filtros, Gráficos, Relatórios, Exportação e Paginação');