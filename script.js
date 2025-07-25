// Funções do modal de cadastro são definidas inline no HTML

// Sistema AgroGest Pro - Gestão Profissional de Custos Rurais
class AgroGestPro {
    constructor() {
        this.costs = JSON.parse(localStorage.getItem('agrogest_costs')) || [];
        this.farmData = JSON.parse(localStorage.getItem('agrogest_farm_data')) || {
            name: '',
            owner: '',
            size: 0
        };
        
        this.init();
    }

    // Salvar dados
    saveData() {
        localStorage.setItem('agrogest_costs', JSON.stringify(this.costs));
        localStorage.setItem('agrogest_farm_data', JSON.stringify(this.farmData));
        
        // Mostrar indicador de salvamento
        this.showSaveIndicator();
    }

    showSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.innerHTML = '💾 Dados salvos automaticamente';
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            indicator.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(indicator)) {
                    document.body.removeChild(indicator);
                }
            }, 300);
        }, 2000);
    }

    init() {
        this.setupMainSystem();
    }


    setupMainSystem() {
        this.setupEventListeners();
        this.loadFarmData();
        this.updateDashboard();
        this.renderTable();
        this.renderCharts();
        this.renderReports();
        this.setTodayDate();
        this.addSampleData();
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Criar elemento de mensagem
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast ${type}`;
        messageEl.textContent = message;
        
        // Adicionar ao DOM
        document.body.appendChild(messageEl);
        
        // Animação de entrada
        setTimeout(() => {
            messageEl.classList.add('show');
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('costForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCost();
        });

        // Farm info inputs
        document.getElementById('farmName').addEventListener('change', (e) => {
            this.farmData.name = e.target.value;
            this.saveData();
        });

        document.getElementById('farmOwner').addEventListener('change', (e) => {
            this.farmData.owner = e.target.value;
            this.saveData();
        });

        document.getElementById('farmSize').addEventListener('change', (e) => {
            this.farmData.size = parseFloat(e.target.value) || 0;
            this.saveData();
            this.updateDashboard();
        });

        // Filters
        document.getElementById('searchFilter').addEventListener('input', () => this.applyFilters());
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('cultureFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('seasonFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('dateFromFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('dateToFilter').addEventListener('change', () => this.applyFilters());

        // Real-time formatting
        document.getElementById('amount').addEventListener('input', (e) => {
            const value = e.target.value;
            if (value && !isNaN(value)) {
                e.target.style.color = '#4a7c59';
            } else {
                e.target.style.color = '#333';
            }
        });

        // Auto-save para inputs importantes
        const autoSaveInputs = ['farmName', 'farmOwner', 'farmSize'];
        autoSaveInputs.forEach(inputId => {
            document.getElementById(inputId).addEventListener('blur', () => {
                this.saveData();
            });
        });
    }

    loadFarmData() {
        document.getElementById('farmName').value = this.farmData.name;
        document.getElementById('farmOwner').value = this.farmData.owner;
        document.getElementById('farmSize').value = this.farmData.size;
    }

    saveFarmData() {
        this.saveData();
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        
        // Set current season
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let season = '';
        
        if (currentMonth >= 9 || currentMonth <= 2) {
            season = `${currentYear}/${currentYear + 1}`;
        } else {
            season = `${currentYear - 1}/${currentYear}`;
        }
        
        document.getElementById('season').value = season;
    }

    addCost() {
        const formData = {
            id: Date.now(),
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            amount: parseFloat(document.getElementById('amount').value),
            date: document.getElementById('date').value,
            season: document.getElementById('season').value,
            area: parseFloat(document.getElementById('area').value) || 0,
            culture: document.getElementById('culture').value || 'geral',
            supplier: document.getElementById('supplier').value || '',
            paymentMethod: document.getElementById('paymentMethod').value || '',
            notes: document.getElementById('notes').value || '',
            createdAt: new Date().toISOString()
        };

        if (!formData.description || !formData.category || !formData.amount || !formData.date || !formData.season) {
            this.showErrorMessage('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const cost = {
            ...formData,
            costPerHectare: formData.area > 0 ? formData.amount / formData.area : 0
        };

        this.costs.push(cost);
        this.saveData();
        
        // Reset form
        document.getElementById('costForm').reset();
        this.setTodayDate();
        
        // Update UI
        this.updateDashboard();
        this.renderTable();
        this.renderCharts();
        this.renderReports();
        
        // Show success message
        this.showSuccessMessage('Custo adicionado com sucesso!');
        
        // Scroll to table
        document.querySelector('.table-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    deleteCost(id) {
        this.showConfirmModal(
            'Tem certeza que deseja excluir este registro de custo?',
            () => {
                this.costs = this.costs.filter(cost => cost.id !== id);
                this.saveData();
                this.updateDashboard();
                this.renderTable();
                this.renderCharts();
                this.renderReports();
                this.showSuccessMessage('Custo excluído com sucesso!');
            }
        );
    }

    clearForm() {
        document.getElementById('costForm').reset();
        this.setTodayDate();
    }

    saveCosts() {
        this.saveData();
    }

    updateDashboard() {
        const totalCost = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const currentSeason = this.getCurrentSeason();
        const seasonCosts = this.costs.filter(cost => cost.season === currentSeason);
        const seasonTotal = seasonCosts.reduce((sum, cost) => sum + cost.amount, 0);
        
        const costPerHectare = this.farmData.size > 0 ? totalCost / this.farmData.size : 0;
        const equipmentCosts = this.getCostsByCategory(['maquinas', 'implementos', 'manutencao', 'combustivel']);
        const inputCosts = this.getCostsByCategory(['sementes', 'fertilizantes', 'defensivos', 'racoes']);
        
        // Calculate profitability (simplified example)
        const estimatedRevenue = this.farmData.size * 3000; // R$ 3000 per hectare (example)
        const profitability = estimatedRevenue > 0 ? ((estimatedRevenue - totalCost) / estimatedRevenue) * 100 : 0;

        document.getElementById('totalCost').textContent = this.formatCurrency(totalCost);
        document.getElementById('costPerHectare').textContent = this.formatCurrency(costPerHectare);
        document.getElementById('currentSeason').textContent = currentSeason;
        document.getElementById('profitability').textContent = `${profitability.toFixed(1)}%`;
        document.getElementById('equipmentCost').textContent = this.formatCurrency(equipmentCosts);
        document.getElementById('inputCost').textContent = this.formatCurrency(inputCosts);

        // Update change indicators (simplified)
        document.getElementById('costChange').textContent = this.getChangeIndicator(totalCost, 'cost');
        document.getElementById('hectareChange').textContent = this.getChangeIndicator(costPerHectare, 'hectare');
        document.getElementById('seasonChange').textContent = `${seasonCosts.length} registros`;
        document.getElementById('profitChange').textContent = profitability >= 0 ? '📈 Positiva' : '📉 Negativa';
        document.getElementById('equipmentChange').textContent = this.getChangeIndicator(equipmentCosts, 'equipment');
        document.getElementById('inputChange').textContent = this.getChangeIndicator(inputCosts, 'input');
    }

    getCurrentSeason() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        if (currentMonth >= 9 || currentMonth <= 2) {
            return `${currentYear}/${currentYear + 1}`;
        } else {
            return `${currentYear - 1}/${currentYear}`;
        }
    }

    getCostsByCategory(categories) {
        return this.costs
            .filter(cost => categories.includes(cost.category))
            .reduce((sum, cost) => sum + cost.amount, 0);
    }

    getChangeIndicator(value, type) {
        if (value === 0) return '-';
        
        const indicators = {
            cost: value > 100000 ? '📈 Alto' : value > 50000 ? '📊 Médio' : '📉 Baixo',
            hectare: value > 1000 ? '📈 Alto' : value > 500 ? '📊 Médio' : '📉 Baixo',
            equipment: value > 50000 ? '📈 Alto' : value > 20000 ? '📊 Médio' : '📉 Baixo',
            input: value > 30000 ? '📈 Alto' : value > 15000 ? '📊 Médio' : '📉 Baixo'
        };
        
        return indicators[type] || '-';
    }

    getCategoryName(category) {
        const categoryNames = {
            'sementes': 'Sementes e Mudas',
            'fertilizantes': 'Fertilizantes',
            'defensivos': 'Defensivos',
            'irrigacao': 'Irrigação',
            'colheita': 'Colheita',
            'racoes': 'Rações',
            'medicamentos': 'Medicamentos Vet.',
            'reproducao': 'Reprodução',
            'manejo': 'Manejo Animal',
            'maquinas': 'Máquinas',
            'implementos': 'Implementos',
            'manutencao': 'Manutenção',
            'combustivel': 'Combustível',
            'mao-obra-fixa': 'Mão de Obra Fixa',
            'mao-obra-temporaria': 'Mão de Obra Temp.',
            'servicos-terceiros': 'Serviços Terceiros',
            'construcoes': 'Construções',
            'cercas': 'Cercas',
            'energia': 'Energia',
            'agua': 'Água',
            'impostos': 'Impostos',
            'seguros': 'Seguros',
            'consultoria': 'Consultoria',
            'financeiro': 'Custos Financeiros'
        };
        return categoryNames[category] || category;
    }

    getCultureName(culture) {
        const cultureNames = {
            'soja': 'Soja',
            'milho': 'Milho',
            'trigo': 'Trigo',
            'algodao': 'Algodão',
            'arroz': 'Arroz',
            'feijao': 'Feijão',
            'cana': 'Cana-de-açúcar',
            'cafe': 'Café',
            'bovinos': 'Bovinos',
            'suinos': 'Suínos',
            'aves': 'Aves',
            'geral': 'Geral'
        };
        return cultureNames[culture] || culture;
    }

    renderTable() {
        const tbody = document.getElementById('costsTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (this.costs.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        const sortedCosts = [...this.costs].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = sortedCosts.map(cost => `
            <tr class="fade-in">
                <td>${this.formatDate(cost.date)}</td>
                <td>${cost.description}</td>
                <td>
                    <span class="category-badge category-${cost.category}">
                        ${this.getCategoryName(cost.category)}
                    </span>
                </td>
                <td>${this.getCultureName(cost.culture)}</td>
                <td>${cost.season}</td>
                <td>${cost.area > 0 ? cost.area.toFixed(2) : '-'}</td>
                <td class="amount-value">${this.formatCurrency(cost.amount)}</td>
                <td class="amount-value">${cost.costPerHectare > 0 ? this.formatCurrency(cost.costPerHectare) : '-'}</td>
                <td>${cost.supplier || '-'}</td>
                <td>
                    <button class="delete-btn" onclick="agroGest.deleteCost(${cost.id})">
                        🗑️ Excluir
                    </button>
                </td>
            </tr>
        `).join('');
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const cultureFilter = document.getElementById('cultureFilter').value;
        const seasonFilter = document.getElementById('seasonFilter').value;
        const dateFrom = document.getElementById('dateFromFilter').value;
        const dateTo = document.getElementById('dateToFilter').value;

        let filteredCosts = this.costs;

        if (searchTerm) {
            filteredCosts = filteredCosts.filter(cost => 
                cost.description.toLowerCase().includes(searchTerm) ||
                cost.supplier.toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter) {
            filteredCosts = filteredCosts.filter(cost => cost.category === categoryFilter);
        }

        if (cultureFilter) {
            filteredCosts = filteredCosts.filter(cost => cost.culture === cultureFilter);
        }

        if (seasonFilter) {
            filteredCosts = filteredCosts.filter(cost => cost.season === seasonFilter);
        }

        if (dateFrom) {
            filteredCosts = filteredCosts.filter(cost => cost.date >= dateFrom);
        }

        if (dateTo) {
            filteredCosts = filteredCosts.filter(cost => cost.date <= dateTo);
        }

        this.renderFilteredTable(filteredCosts);
    }

    renderFilteredTable(filteredCosts) {
        const tbody = document.getElementById('costsTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (filteredCosts.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        const sortedCosts = [...filteredCosts].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = sortedCosts.map(cost => `
            <tr class="fade-in">
                <td>${this.formatDate(cost.date)}</td>
                <td>${cost.description}</td>
                <td>
                    <span class="category-badge category-${cost.category}">
                        ${this.getCategoryName(cost.category)}
                    </span>
                </td>
                <td>${this.getCultureName(cost.culture)}</td>
                <td>${cost.season}</td>
                <td>${cost.area > 0 ? cost.area.toFixed(2) : '-'}</td>
                <td class="amount-value">${this.formatCurrency(cost.amount)}</td>
                <td class="amount-value">${cost.costPerHectare > 0 ? this.formatCurrency(cost.costPerHectare) : '-'}</td>
                <td>${cost.supplier || '-'}</td>
                <td>
                    <button class="delete-btn" onclick="agroGest.deleteCost(${cost.id})">
                        🗑️ Excluir
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderCharts() {
        this.renderCategoryChart();
        this.renderCultureChart();
        this.renderMonthlyChart();
        this.renderTopCostsChart();
    }

    renderCategoryChart() {
        const chartContainer = document.getElementById('categoryChart');
        
        if (this.costs.length === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #666;">Nenhum dado para exibir</p>';
            return;
        }

        const categoryTotals = {};
        this.costs.forEach(cost => {
            categoryTotals[cost.category] = (categoryTotals[cost.category] || 0) + cost.amount;
        });

        const maxAmount = Math.max(...Object.values(categoryTotals));
        const totalAmount = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        
        chartContainer.innerHTML = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .map(([category, total]) => {
                const percentage = (total / maxAmount) * 100;
                return `
                    <div class="chart-bar">
                        <div class="chart-bar-label">${this.getCategoryName(category)}</div>
                        <div class="chart-bar-fill" style="height: ${Math.max(percentage, 20)}%">
                            ${this.formatCurrency(total)}
                        </div>
                        <div class="chart-bar-value">${((total / totalAmount) * 100).toFixed(1)}%</div>
                    </div>
                `;
            }).join('');
    }

    renderCultureChart() {
        const chartContainer = document.getElementById('cultureChart');
        
        if (this.costs.length === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #666;">Nenhum dado para exibir</p>';
            return;
        }

        const cultureTotals = {};
        this.costs.forEach(cost => {
            cultureTotals[cost.culture] = (cultureTotals[cost.culture] || 0) + cost.amount;
        });

        const maxAmount = Math.max(...Object.values(cultureTotals));
        const totalAmount = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        
        chartContainer.innerHTML = Object.entries(cultureTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .map(([culture, total]) => {
                const percentage = (total / maxAmount) * 100;
                return `
                    <div class="chart-bar">
                        <div class="chart-bar-label">${this.getCultureName(culture)}</div>
                        <div class="chart-bar-fill" style="height: ${Math.max(percentage, 20)}%">
                            ${this.formatCurrency(total)}
                        </div>
                        <div class="chart-bar-value">${((total / totalAmount) * 100).toFixed(1)}%</div>
                    </div>
                `;
            }).join('');
    }

    renderMonthlyChart() {
        const chartContainer = document.getElementById('monthlyChart');
        
        if (this.costs.length === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #666;">Nenhum dado para exibir</p>';
            return;
        }

        const monthlyTotals = {};
        this.costs.forEach(cost => {
            const month = new Date(cost.date).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            monthlyTotals[month] = (monthlyTotals[month] || 0) + cost.amount;
        });

        const maxAmount = Math.max(...Object.values(monthlyTotals));
        
        chartContainer.innerHTML = Object.entries(monthlyTotals)
            .sort(([a], [b]) => new Date('01 ' + a) - new Date('01 ' + b))
            .slice(-6)
            .map(([month, total]) => {
                const percentage = (total / maxAmount) * 100;
                return `
                    <div class="chart-bar">
                        <div class="chart-bar-label">${month}</div>
                        <div class="chart-bar-fill" style="height: ${Math.max(percentage, 20)}%">
                            ${this.formatCurrency(total)}
                        </div>
                        <div class="chart-bar-value">${total.toFixed(0)}</div>
                    </div>
                `;
            }).join('');
    }

    renderTopCostsChart() {
        const chartContainer = document.getElementById('topCostsChart');
        
        if (this.costs.length === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #666;">Nenhum dado para exibir</p>';
            return;
        }

        const topCosts = [...this.costs]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        const maxAmount = Math.max(...topCosts.map(cost => cost.amount));
        
        chartContainer.innerHTML = topCosts.map(cost => {
            const percentage = (cost.amount / maxAmount) * 100;
            return `
                <div class="chart-bar">
                    <div class="chart-bar-label">${cost.description.substring(0, 20)}...</div>
                    <div class="chart-bar-fill" style="height: ${Math.max(percentage, 20)}%">
                        ${this.formatCurrency(cost.amount)}
                    </div>
                    <div class="chart-bar-value">${this.getCategoryName(cost.category)}</div>
                </div>
            `;
        }).join('');
    }

    renderReports() {
        this.renderFinancialSummary();
        this.renderSeasonAnalysis();
        this.renderProductivityIndicators();
    }

    renderFinancialSummary() {
        const container = document.getElementById('financialSummary');
        const totalCost = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const avgCost = this.costs.length > 0 ? totalCost / this.costs.length : 0;
        const highestCost = this.costs.length > 0 ? Math.max(...this.costs.map(c => c.amount)) : 0;
        const lowestCost = this.costs.length > 0 ? Math.min(...this.costs.map(c => c.amount)) : 0;

        container.innerHTML = `
            <div class="report-item">
                <span class="report-label">Custo Total:</span>
                <span class="report-value">${this.formatCurrency(totalCost)}</span>
            </div>
            <div class="report-item">
                <span class="report-label">Custo Médio:</span>
                <span class="report-value">${this.formatCurrency(avgCost)}</span>
            </div>
            <div class="report-item">
                <span class="report-label">Maior Custo:</span>
                <span class="report-value">${this.formatCurrency(highestCost)}</span>
            </div>
            <div class="report-item">
                <span class="report-label">Menor Custo:</span>
                <span class="report-value">${this.formatCurrency(lowestCost)}</span>
            </div>
            <div class="report-item">
                <span class="report-label">Total de Registros:</span>
                <span class="report-value">${this.costs.length}</span>
            </div>
        `;
    }

    renderSeasonAnalysis() {
        const container = document.getElementById('seasonAnalysis');
        const seasonTotals = {};
        
        this.costs.forEach(cost => {
            seasonTotals[cost.season] = (seasonTotals[cost.season] || 0) + cost.amount;
        });

        const entries = Object.entries(seasonTotals).sort(([,a], [,b]) => b - a);
        
        container.innerHTML = entries.slice(0, 5).map(([season, total]) => `
            <div class="report-item">
                <span class="report-label">Safra ${season}:</span>
                <span class="report-value">${this.formatCurrency(total)}</span>
            </div>
        `).join('') || '<p>Nenhuma safra registrada</p>';
    }

    renderProductivityIndicators() {
        const container = document.getElementById('productivityIndicators');
        const totalCost = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const costPerHectare = this.farmData.size > 0 ? totalCost / this.farmData.size : 0;
        const costsWithArea = this.costs.filter(cost => cost.area > 0);
        const avgCostPerHectare = costsWithArea.length > 0 ? 
            costsWithArea.reduce((sum, cost) => sum + cost.costPerHectare, 0) / costsWithArea.length : 0;

        container.innerHTML = `
            <div class="report-item">
                <span class="report-label">Custo por Hectare:</span>
                <span class="report-value">${this.formatCurrency(costPerHectare)}</span>
            </div>
            <div class="report-item">
                <span class="report-label">Custo Médio/ha:</span>
                <span class="report-value">${this.formatCurrency(avgCostPerHectare)}</span>
            </div>
            <div class="report-item">
                <span class="report-label">Área Total:</span>
                <span class="report-value">${this.farmData.size.toFixed(2)} ha</span>
            </div>
            <div class="report-item">
                <span class="report-label">Registros com Área:</span>
                <span class="report-value">${costsWithArea.length}</span>
            </div>
            <div class="report-item">
                <span class="report-label">Eficiência:</span>
                <span class="report-value">${costPerHectare > 0 ? (costPerHectare < 2000 ? 'Alta' : costPerHectare < 4000 ? 'Média' : 'Baixa') : '-'}</span>
            </div>
        `;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4a7c59' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        notification.querySelector('button').style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin-left: 10px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmBtn');

        messageElement.textContent = message;
        modal.style.display = 'block';

        confirmBtn.onclick = () => {
            onConfirm();
            this.closeModal();
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        };
    }

    closeModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    generateReport() {
        const reportContent = this.generateReportContent();
        const modal = document.getElementById('reportModal');
        const content = document.getElementById('reportContent');
        
        content.innerHTML = reportContent;
        modal.style.display = 'block';
    }

    generateReportContent() {
        const farmInfo = this.farmData.name ? `
            <h3>📋 Informações da Propriedade</h3>
            <p><strong>Nome:</strong> ${this.farmData.name}</p>
            <p><strong>Proprietário:</strong> ${this.farmData.owner}</p>
            <p><strong>Área:</strong> ${this.farmData.size} hectares</p>
            <hr>
        ` : '';

        const totalCost = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const costPerHectare = this.farmData.size > 0 ? totalCost / this.farmData.size : 0;
        
        const categoryAnalysis = this.generateCategoryAnalysis();
        const seasonAnalysis = this.generateSeasonAnalysis();
        const recentCosts = this.costs
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        return `
            ${farmInfo}
            <h3>💰 Resumo Financeiro</h3>
            <p><strong>Custo Total:</strong> ${this.formatCurrency(totalCost)}</p>
            <p><strong>Custo por Hectare:</strong> ${this.formatCurrency(costPerHectare)}</p>
            <p><strong>Total de Registros:</strong> ${this.costs.length}</p>
            <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <hr>
            
            <h3>📊 Análise por Categoria</h3>
            ${categoryAnalysis}
            <hr>
            
            <h3>🌾 Análise por Safra</h3>
            ${seasonAnalysis}
            <hr>
            
            <h3>📋 Últimos Registros</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Data</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Descrição</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Categoria</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentCosts.map(cost => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(cost.date)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${cost.description}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${this.getCategoryName(cost.category)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${this.formatCurrency(cost.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateCategoryAnalysis() {
        const categoryTotals = {};
        this.costs.forEach(cost => {
            categoryTotals[cost.category] = (categoryTotals[cost.category] || 0) + cost.amount;
        });

        const totalAmount = this.costs.reduce((sum, cost) => sum + cost.amount, 0);
        
        return Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([category, total]) => {
                const percentage = ((total / totalAmount) * 100).toFixed(1);
                return `<p><strong>${this.getCategoryName(category)}:</strong> ${this.formatCurrency(total)} (${percentage}%)</p>`;
            }).join('');
    }

    generateSeasonAnalysis() {
        const seasonTotals = {};
        this.costs.forEach(cost => {
            seasonTotals[cost.season] = (seasonTotals[cost.season] || 0) + cost.amount;
        });

        return Object.entries(seasonTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([season, total]) => {
                const count = this.costs.filter(cost => cost.season === season).length;
                return `<p><strong>Safra ${season}:</strong> ${this.formatCurrency(total)} (${count} registros)</p>`;
            }).join('') || '<p>Nenhuma safra registrada</p>';
    }

    exportToCSV() {
        if (this.costs.length === 0) {
            this.showNotification('Nenhum dado para exportar.', 'error');
            return;
        }

        const headers = ['Data', 'Descrição', 'Categoria', 'Cultura', 'Safra', 'Área (ha)', 'Valor Total', 'Valor/ha', 'Fornecedor', 'Forma Pagamento', 'Observações'];
        
        // Ordenar dados por data (mais recente primeiro)
        const sortedCosts = [...this.costs].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const csvContent = [
            headers.join(';'), // Usar ponto e vírgula para separador (padrão brasileiro)
            ...sortedCosts.map(cost => [
                this.formatDate(cost.date), // Usar formatação brasileira
                `"${cost.description.replace(/"/g, '""')}"`, // Escapar aspas duplas
                `"${this.getCategoryName(cost.category)}"`,
                `"${this.getCultureName(cost.culture)}"`,
                cost.season,
                cost.area > 0 ? cost.area.toFixed(2).replace('.', ',') : '0,00', // Formatação brasileira
                cost.amount.toFixed(2).replace('.', ','), // Formatação brasileira
                cost.costPerHectare > 0 ? cost.costPerHectare.toFixed(2).replace('.', ',') : '0,00',
                `"${(cost.supplier || '').replace(/"/g, '""')}"`, // Escapar aspas e tratar valores vazios
                cost.paymentMethod || '',
                `"${(cost.notes || '').replace(/"/g, '""')}"` // Escapar aspas e tratar valores vazios
            ].join(';'))
        ].join('\n');

        // Adicionar BOM (Byte Order Mark) para UTF-8 para Excel reconhecer caracteres especiais
        const csvWithBOM = '\ufeff' + csvContent;
        
        this.downloadFile(csvWithBOM, 'custos_rurais.csv', 'text/csv;charset=utf-8');
        this.showNotification('Arquivo CSV exportado com sucesso!', 'success');
    }

    exportToExcel() {
        if (this.costs.length === 0) {
            this.showNotification('Nenhum dado para exportar.', 'error');
            return;
        }

        // Criar conteúdo HTML para Excel
        const headers = ['Data', 'Descrição', 'Categoria', 'Cultura', 'Safra', 'Área (ha)', 'Valor Total', 'Valor/ha', 'Fornecedor', 'Forma Pagamento', 'Observações'];
        
        // Ordenar dados por data (mais recente primeiro)
        const sortedCosts = [...this.costs].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Custos Rurais</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #4a7c59; color: white; font-weight: bold; }
                    .currency { mso-number-format: "R$ #,##0.00"; }
                    .date { mso-number-format: "dd/mm/yyyy"; }
                    .number { mso-number-format: "#,##0.00"; }
                </style>
            </head>
            <body>
                <h1>🌾 AgroGest Pro - Relatório de Custos Rurais</h1>
                <p><strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                <p><strong>Total de Registros:</strong> ${this.costs.length}</p>
                <br>
                <table>
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedCosts.map(cost => `
                            <tr>
                                <td class="date">${this.formatDate(cost.date)}</td>
                                <td>${cost.description}</td>
                                <td>${this.getCategoryName(cost.category)}</td>
                                <td>${this.getCultureName(cost.culture)}</td>
                                <td>${cost.season}</td>
                                <td class="number">${cost.area > 0 ? cost.area.toFixed(2).replace('.', ',') : '0,00'}</td>
                                <td class="currency">${cost.amount.toFixed(2).replace('.', ',')}</td>
                                <td class="currency">${cost.costPerHectare > 0 ? cost.costPerHectare.toFixed(2).replace('.', ',') : '0,00'}</td>
                                <td>${cost.supplier || ''}</td>
                                <td>${cost.paymentMethod || ''}</td>
                                <td>${cost.notes || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <br>
                <p><strong>Resumo Financeiro:</strong></p>
                <table style="width: 300px;">
                    <tr><td><strong>Custo Total:</strong></td><td class="currency">${this.costs.reduce((sum, cost) => sum + cost.amount, 0).toFixed(2).replace('.', ',')}</td></tr>
                    <tr><td><strong>Custo Médio:</strong></td><td class="currency">${(this.costs.reduce((sum, cost) => sum + cost.amount, 0) / this.costs.length).toFixed(2).replace('.', ',')}</td></tr>
                    <tr><td><strong>Custo por Hectare:</strong></td><td class="currency">${this.farmData.size > 0 ? (this.costs.reduce((sum, cost) => sum + cost.amount, 0) / this.farmData.size).toFixed(2).replace('.', ',') : '0,00'}</td></tr>
                </table>
            </body>
            </html>
        `;

        // Adicionar BOM para UTF-8
        const excelWithBOM = '\ufeff' + excelContent;
        
        this.downloadFile(excelWithBOM, 'custos_rurais.xls', 'application/vnd.ms-excel;charset=utf-8');
        this.showNotification('Arquivo Excel exportado com sucesso!', 'success');
    }

    exportToPDF() {
        const reportContent = this.generateReportContent();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Custos Rurais - ${this.farmData.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h3 { color: #2d5a27; margin-top: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                        th { background-color: #f8f9fa; }
                        hr { margin: 20px 0; border: 1px solid #eee; }
                    </style>
                </head>
                <body>
                    <h1>🌾 Relatório de Custos Rurais</h1>
                    ${reportContent}
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Relatório gerado em ${new Date().toLocaleString('pt-BR')} pelo Sistema AgroGest Pro
                    </p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        this.showNotification('Relatório PDF gerado com sucesso!', 'success');
    }

    printReport() {
        window.print();
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearAllData() {
        this.showConfirmModal(
            'Tem certeza que deseja excluir TODOS os registros de custos? Esta ação não pode ser desfeita.',
            () => {
                this.costs = [];
                this.saveCosts();
                this.updateDashboard();
                this.renderTable();
                this.renderCharts();
                this.renderReports();
                this.showNotification('Todos os dados foram excluídos.', 'success');
            }
        );
    }

    addSampleData() {
        // Sistema iniciando com dados zerados
        console.log('📊 Sistema iniciado - dados zerados');
        console.log('💡 Dica: Comece cadastrando as informações da sua fazenda no cabeçalho');
    }

    // Método para adicionar dados de exemplo quando solicitado
    addSampleDataForUser() {
        if (this.costs.length > 0) {
            this.showErrorMessage('Você já possui dados cadastrados. Limpe todos os dados antes de adicionar exemplos.');
            return;
        }

        const sampleCosts = [
            {
                id: Date.now() + 1,
                description: 'Sementes de Soja Transgênica',
                category: 'sementes',
                culture: 'soja',
                season: '2024/2025',
                amount: 15000.00,
                area: 100,
                costPerHectare: 150.00,
                supplier: 'Sementes Brasil Ltda',
                paymentMethod: '60-dias',
                notes: 'Variedade BRS 123RR',
                date: '2025-01-15',
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                description: 'Fertilizante NPK 04-14-08',
                category: 'fertilizantes',
                culture: 'soja',
                season: '2024/2025',
                amount: 8500.00,
                area: 100,
                costPerHectare: 85.00,
                supplier: 'Fertilizantes Campo Verde',
                paymentMethod: '30-dias',
                notes: 'Aplicação na base',
                date: '2025-01-10',
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 3,
                description: 'Trator New Holland TL75',
                category: 'maquinas',
                culture: 'geral',
                season: '2024/2025',
                amount: 85000.00,
                area: 0,
                costPerHectare: 0,
                supplier: 'Máquinas Agrícolas Sul',
                paymentMethod: 'financiamento',
                notes: 'Financiamento em 60 meses',
                date: '2025-01-05',
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 4,
                description: 'Defensivo Glifosato',
                category: 'defensivos',
                culture: 'soja',
                season: '2024/2025',
                amount: 3200.00,
                area: 100,
                costPerHectare: 32.00,
                supplier: 'Defensivos Agro',
                paymentMethod: 'avista',
                notes: 'Dessecação pré-plantio',
                date: '2025-01-08',
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 5,
                description: 'Combustível Diesel S10',
                category: 'combustivel',
                culture: 'geral',
                season: '2024/2025',
                amount: 2500.00,
                area: 0,
                costPerHectare: 0,
                supplier: 'Posto Rural',
                paymentMethod: 'avista',
                notes: '1000 litros',
                date: '2025-01-12',
                createdAt: new Date().toISOString()
            }
        ];

        this.costs = sampleCosts;
        this.saveData();
        this.updateDashboard();
        this.renderTable();
        this.renderCharts();
        this.renderReports();
        
        this.showSuccessMessage('Dados de exemplo adicionados com sucesso! 🎉');
        
        // Scroll para a tabela
        setTimeout(() => {
            document.querySelector('.table-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 1000);
    }

    // Método para limpar todos os dados do usuário atual
    clearAllUserData() {
        this.showConfirmModal(
            'Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.',
            () => {
                this.costs = [];
                this.farmData = {
                    name: '',
                    owner: '',
                    size: 0
                };
                this.saveData();
                this.loadFarmData();
                this.updateDashboard();
                this.renderTable();
                this.renderCharts();
                this.renderReports();
                this.showSuccessMessage('Todos os dados foram limpos com sucesso!');
            }
        );
    }


}

// Funções globais para uso no HTML
function clearFilters() {
    document.getElementById('searchFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('cultureFilter').value = '';
    document.getElementById('seasonFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    
    if (window.agroGest) {
        window.agroGest.applyFilters();
    }
}

function generateReport() {
    if (window.agroGest) {
        window.agroGest.generateReport();
    }
}

function exportToCSV() {
    if (window.agroGest) {
        window.agroGest.exportToCSV();
    }
}

function exportToExcel() {
    if (window.agroGest) {
        window.agroGest.exportToExcel();
    }
}

function exportToPDF() {
    if (window.agroGest) {
        window.agroGest.exportToPDF();
    }
}

function printReport() {
    if (window.agroGest) {
        window.agroGest.printReport();
    }
}

function clearAllData() {
    if (window.agroGest) {
        window.agroGest.clearAllUserData();
    }
}

function closeModal() {
    if (window.agroGest) {
        window.agroGest.closeModal();
    }
}

function closeReportModal() {
    if (window.agroGest) {
        window.agroGest.closeReportModal();
    }
}


function exportReportToCSV() {
    if (window.agroGest) {
        window.agroGest.exportReportToCSV();
    }
}

function scrollToForm() {
    document.querySelector('.form-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Focar no primeiro campo
    setTimeout(() => {
        document.getElementById('description').focus();
    }, 500);
}

function addSampleData() {
    if (window.agroGest) {
        window.agroGest.addSampleDataForUser();
    }
}

// Global functions
function clearFilters() {
    document.getElementById('searchFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('cultureFilter').value = '';
    document.getElementById('seasonFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    agroGest.renderTable();
}

function generateReport() {
    agroGest.generateReport();
}

function exportToCSV() {
    agroGest.exportToCSV();
}

function exportToExcel() {
    agroGest.exportToExcel();
}

function exportToPDF() {
    agroGest.exportToPDF();
}

function printReport() {
    agroGest.printReport();
}

function clearAllData() {
    agroGest.clearAllData();
}

function closeModal() {
    agroGest.closeModal();
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function exportReportToCSV() {
    if (agroGest.costs.length === 0) {
        agroGest.showNotification('Nenhum dado para exportar.', 'error');
        return;
    }

    const farmInfo = agroGest.farmData.name ? [
        ['INFORMAÇÕES DA PROPRIEDADE'],
        ['Nome:', agroGest.farmData.name],
        ['Proprietário:', agroGest.farmData.owner],
        ['Área:', `${agroGest.farmData.size} hectares`],
        [''],
    ] : [];

    const totalCost = agroGest.costs.reduce((sum, cost) => sum + cost.amount, 0);
    const costPerHectare = agroGest.farmData.size > 0 ? totalCost / agroGest.farmData.size : 0;

    const summaryInfo = [
        ['RESUMO FINANCEIRO'],
        ['Custo Total:', `R$ ${totalCost.toFixed(2).replace('.', ',')}`],
        ['Custo por Hectare:', `R$ ${costPerHectare.toFixed(2).replace('.', ',')}`],
        ['Total de Registros:', agroGest.costs.length],
        ['Data do Relatório:', new Date().toLocaleDateString('pt-BR')],
        [''],
    ];

    const headers = ['Data', 'Descrição', 'Categoria', 'Cultura', 'Safra', 'Área (ha)', 'Valor Total', 'Valor/ha', 'Fornecedor', 'Forma Pagamento', 'Observações'];
    
    const sortedCosts = [...agroGest.costs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tableData = [
        ['REGISTROS DE CUSTOS'],
        headers,
        ...sortedCosts.map(cost => [
            agroGest.formatDate(cost.date),
            cost.description,
            agroGest.getCategoryName(cost.category),
            agroGest.getCultureName(cost.culture),
            cost.season,
            cost.area > 0 ? cost.area.toFixed(2).replace('.', ',') : '0,00',
            cost.amount.toFixed(2).replace('.', ','),
            cost.costPerHectare > 0 ? cost.costPerHectare.toFixed(2).replace('.', ',') : '0,00',
            cost.supplier || '',
            cost.paymentMethod || '',
            cost.notes || ''
        ])
    ];

    const csvContent = [
        ...farmInfo,
        ...summaryInfo,
        ...tableData
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');

    const csvWithBOM = '\ufeff' + csvContent;
    
    window.agroGest.downloadFile(csvWithBOM, 'relatorio_custos_rurais.csv', 'text/csv;charset=utf-8');
    window.agroGest.showNotification('Relatório CSV exportado com sucesso!', 'success');
}

// Console welcome message
console.log('🌾 AgroGest Pro - Sistema de Gestão Rural carregado com sucesso!');
console.log('📊 Recursos: Dashboard, Análises, Relatórios, Exportação');
console.log('⌨️ Atalhos: Ctrl+N (novo custo), Ctrl+P (imprimir), Escape (fechar modal)');
console.log('🚀 Desenvolvido para fazendas, sítios e propriedades rurais');

// Inicializar sistema
window.agroGest = new AgroGestPro();

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('description').focus();
    }
    
    if (e.key === 'Escape') {
        window.agroGest.closeModal();
        closeReportModal();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printReport();
    }
});

// Auto-save functionality
setInterval(() => {
    window.agroGest.saveCosts();
    window.agroGest.saveFarmData();
}, 30000);
