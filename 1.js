document.addEventListener('DOMContentLoaded', () => {
    const allProducts = [
        ["green", "01", "Zinc+Magnesium", "Healthy Bones", "./images/1.png"],
        ["berry", "02", "Cough Relief", "Cough mixture 20mg", "./images/2.png"],
        ["orange", "03", "Curcumin", "100 mg", "./images/3.png"],
        ["strawberry", "04", "Vitamin D3", "1000 IU For Bone Strength", "./images/4.png"],
        ["mango", "05", "Diabetic Wellness", "Anthocyanine 100mg", "./images/5.png"],
        ["banana", "06", "Green Tea", "100mg, Mouth Dissolving Strip", "./images/6.png"],
        ["watermelon", "08", "Melatonin", "5 mg Healthy Sleep Cycle", "./images/8.png"],
        ["chocolate", "09", "Gut Health", "100mg Prevent Gas & Acidity.", "./images/9.png"]
    ];

    const productsPerPage = 4;
    let currentPage = 0;
    const totalPages = Math.ceil(allProducts.length / productsPerPage);

    const productColumnsContainer = document.getElementById('product-columns-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const cartItemCountSpan = document.getElementById('cart-item-count');
    const mainNav = document.getElementById('main-nav');
    const topRightLinks = document.getElementById('top-right-links');
    let currentProductToAdd = null; 
    const activeTimeouts = new Map();

    function clearColumnTimeouts(columnId) {
        if (activeTimeouts.has(columnId)) {
            activeTimeouts.get(columnId).forEach(timeoutId => clearTimeout(timeoutId));
            activeTimeouts.delete(columnId);
        }
    }

    function addTimeout(columnId, timeoutId) {
        if (!activeTimeouts.has(columnId)) {
            activeTimeouts.set(columnId, []);
        }
        activeTimeouts.get(columnId).push(timeoutId);
    }

    // --- CART FUNCTIONS START ---

    function getCart() {
        const cart = localStorage.getItem('smoothieJuicyCart');
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        localStorage.setItem('smoothieJuicyCart', JSON.stringify(cart));
    }

   
    function addToCart(product, customerDetails = null) { 
        const cart = getCart();
        const existingProductIndex = cart.findIndex(item => item.id === product.id);

        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += product.quantity;
            cart[existingProductIndex].price = product.price;
            if (customerDetails) {
                cart[existingProductIndex].customer = customerDetails;
            }
        } else {
            cart.push({ ...product, customer: customerDetails });
        }
        saveCart(cart);
        updateCartCount();
    }

   function updateCartCount() {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartItemCountSpan.textContent = totalItems;
        if (totalItems === 0) {
            cartItemCountSpan.classList.add('hidden');
        } else {
            cartItemCountSpan.classList.remove('hidden');
        }
    }

    // --- CART FUNCTIONS END ---

    function createProductColumn(productData) {
        const [id, num, name, desc, img] = productData;
        const col = document.createElement('div');
        col.className = `product-column flex justify-center items-center relative ${id}`;
        col.id = `product-column-${id}`;

        col.innerHTML = `
            <img class="product-column-image" src="${img}" alt="${name}"/>
            <div class="product-content-wrapper w-full flex flex-col items-start justify-start z-20 pt-6">
                <div class="product-text-group">
                    <h2 class="product-column-name">${name}</h2>
                    <p class="product-column-description">${desc}</p>
                    <button class="view-more-small-button-column mt-4">View More</button>
                    <ul class="detailed-description"></ul>
                    <button class="add-to-cart-btn mt-4">Add to Cart</button>
                </div>
            </div>
            <div class="background-icons">
                <img src="./images/Layer 1.png" alt="Background Icon" class="bg-icon-bottom-left" />
                <img src="./images/Layer 1.png" alt="Background Icon" class="bg-icon-top-right" />
                <img src="./images/Layer 1.png" alt="Background Icon" class="bg-icon-center-left" />
                <img src="./images/Layer 1.png" alt="Background Icon" class="bg-icon-center-right" />
            </div>
            <div class="quantity-buttons">
                <button data-price="50">1M</button>
                <button data-price="80" class="active">3M</button>
                <button data-price="120">6M</button>
            </div>
            <div class="price-display">$80</div>
            <button class="shrink-button">Back</button>
            <div class="dosages-container">
                <h3 class="font-semibold mb-2">Dosage:</h3>
                <ul class="dosage-list"></ul>
            </div>
            <div class="advantages-container">
                <h3 class="font-semibold mb-2">Benefits:</h3>
                <ul class="advantages-list"></ul>
            </div>
            <span class="product-column-bg-name">${name.toUpperCase()}</span>
        `;

        const vmb = col.querySelector('.view-more-small-button-column');
        const sb = col.querySelector('.shrink-button');
        const qtyBtnsContainer = col.querySelector('.quantity-buttons');
        const priceDisp = col.querySelector('.price-display');
        const detailedDescriptionElement = col.querySelector('.detailed-description');
        const atc = col.querySelector('.add-to-cart-btn');
        const dosagescontainer = col.querySelector('.dosages-container');
        const advantagesContainer = col.querySelector('.advantages-container');
        const advantagesList = col.querySelector('.advantages-list');
        const dosageListElement = col.querySelector('.dosage-list');
        const allQtyButtons = col.querySelectorAll('.quantity-buttons button');
        const bgIcons = col.querySelector('.background-icons');

        // Modified Add to Cart button event listener for direct add
        atc.addEventListener('click', () => {
            const selectedQuantityElement = col.querySelector('.quantity-buttons button.active');
            const selectedPrice = parseFloat(selectedQuantityElement.getAttribute('data-price'));
            const selectedQuantityText = selectedQuantityElement.textContent;

            let quantity = 1;
            if (selectedQuantityText === '3M') quantity = 3;
            if (selectedQuantityText === '6M') quantity = 6;

            const productToAdd = {
                id: productData[0],
                num: productData[1],
                name: productData[2],
                description: productData[3],
                image: productData[4],
                price: selectedPrice,
                quantity: quantity
            };

            addToCart(productToAdd); 
            alert(`${productToAdd.name} added to cart!`); 
        });


        vmb.addEventListener('click', () => {
            document.querySelectorAll('.product-column').forEach(otherCol => {
                clearColumnTimeouts(otherCol.id); 
            });

            mainNav.classList.remove('hidden');
            mainNav.classList.add('expanded-nav');
            document.getElementById('nav-products-expanded').classList.add('active'); 
            document.getElementById('nav-contact-expanded').classList.remove('active');

            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';

            document.querySelectorAll('.product-column').forEach(other => {
                other.classList.add('no-hover');
                if (other !== col) {
                    other.classList.remove('expanded', 'stay-hover');
                    other.classList.add('shrunk');
                } else {
                    other.classList.remove('hidden-column', 'shrunk');
                    other.classList.add('expanded', 'stay-hover');
                    vmb.classList.add('hidden');

                    qtyBtnsContainer.classList.add('hidden-with-animation');
                    priceDisp.classList.add('hidden-with-animation');

                    if (bgIcons) bgIcons.style.display = 'block';

                    col.querySelector('.product-column-bg-name').style.opacity = '3';

                    const template = document.getElementById(`desc-${id}`);
                    const rawHtml = template ? template.innerHTML.trim() : 'No description.';

                    const descriptionPoints = rawHtml
                                                .replace(/<br\s*\/?>/g, '')
                                                .split('.')
                                                .map(point => point.trim())
                                                .filter(point => point.length > 0);

                    detailedDescriptionElement.innerHTML = '';
                    detailedDescriptionElement.classList.remove('hidden');
                    detailedDescriptionElement.classList.add('show');

                    let pointIndex = 0;
                    let charIndexInPoint = 0;
                    let currentLi = null;

                    function typeDescription(callback) {
                        if (col.classList.contains('expanded')) { 
                            if (pointIndex < descriptionPoints.length) {
                                if (charIndexInPoint === 0) {
                                    currentLi = document.createElement('li');
                                    detailedDescriptionElement.appendChild(currentLi);
                                }

                                const currentPoint = descriptionPoints[pointIndex];
                                if (charIndexInPoint < currentPoint.length) {
                                    const timeoutId = setTimeout(() => {
                                        currentLi.textContent += currentPoint.charAt(charIndexInPoint);
                                        charIndexInPoint++;
                                        typeDescription(callback);
                                    }, 10);
                                    addTimeout(id, timeoutId);
                                } else {
                                    if (!currentLi.textContent.endsWith('.')) {
                                        currentLi.textContent += '.';
                                    }
                                    pointIndex++;
                                    charIndexInPoint = 0;
                                    const timeoutId = setTimeout(() => typeDescription(callback), 100);
                                    addTimeout(id, timeoutId);
                                }
                            } else {
                                atc.classList.remove('hidden');
                                atc.classList.add('show-btn'); 
                                if (callback) {
                                    callback();
                                }
                            }
                        }
                    }

                    const advantageTemplate = document.getElementById(`adv-${id}`);
                    const advantagesTextRaw = advantageTemplate ? advantageTemplate.innerHTML.trim() : '';
                    const advantages = advantagesTextRaw.split(';').filter(a => a.trim() !== '');

                    const dosageTemplate = document.getElementById(`dos-${id}`);
                    const dosageTextRaw = dosageTemplate ? dosageTemplate.innerHTML.trim() : '';
                    const dosages = dosageTextRaw.split(';').filter(d => d.trim() !== '');

                    function typeDosages() {
                        if (col.classList.contains('expanded')) { 
                            dosagescontainer.classList.add('show-benefits');
                            dosageListElement.innerHTML = '';

                            let dosageIndex = 0;
                            function typeSingleDosage() {
                                if (col.classList.contains('expanded') && dosageIndex < dosages.length) {
                                    const dosage = dosages[dosageIndex].trim();
                                    const li = document.createElement('li');
                                    dosageListElement.appendChild(li);
                                    let charIndex = 0;
                                    function typeChar() {
                                        if (col.classList.contains('expanded') && charIndex < dosage.length) {
                                            li.textContent += dosage.charAt(charIndex);
                                            charIndex++;
                                            const timeoutId = setTimeout(typeChar, 10);
                                            addTimeout(id, timeoutId);
                                        } else {
                                            dosageIndex++;
                                            if (col.classList.contains('expanded') && dosageIndex < dosages.length) {
                                                const timeoutId = setTimeout(typeSingleDosage, 50);
                                                addTimeout(id, timeoutId);
                                            } else if (col.classList.contains('expanded')) {
                                                const timeoutId = setTimeout(typeAdvantages, 100);
                                                addTimeout(id, timeoutId);
                                            }
                                        }
                                    }
                                    typeChar();
                                }
                            }
                            typeSingleDosage();
                        }
                    }

                    function typeAdvantages() {
                        if (col.classList.contains('expanded')) {
                            advantagesContainer.classList.add('show-benefits');
                            advantagesList.innerHTML = '';
                            let advantageIndex = 0;
                            function typeSingleAdvantage() {
                                if (col.classList.contains('expanded') && advantageIndex < advantages.length) {
                                    const advantage = advantages[advantageIndex].trim();
                                    const li = document.createElement('li');
                                    advantagesList.appendChild(li);
                                    let charIndex = 0;
                                    function typeChar() {
                                        if (col.classList.contains('expanded') && charIndex < advantage.length) {
                                            li.textContent += advantage.charAt(charIndex);
                                            charIndex++;
                                            const timeoutId = setTimeout(typeChar, 10);
                                            addTimeout(id, timeoutId);
                                        } else {
                                            advantageIndex++;
                                            if (col.classList.contains('expanded') && advantageIndex < advantages.length) {
                                                const timeoutId = setTimeout(typeSingleAdvantage, 100);
                                                addTimeout(id, timeoutId);
                                            } else if (col.classList.contains('expanded')) {
                                                const timeoutId = setTimeout(() => {
                                                    qtyBtnsContainer.classList.remove('hidden-with-animation');
                                                    qtyBtnsContainer.classList.add('visible-with-animation');
                                                    priceDisp.classList.remove('hidden-with-animation');
                                                    priceDisp.classList.add('visible-with-animation');
                                                }, 500);
                                                addTimeout(id, timeoutId);
                                            }
                                        }
                                    }
                                    typeChar();
                                }
                            }
                            typeSingleAdvantage();
                        }
                    }
                    typeDescription(typeDosages); 
                }
            });
        });

        sb.addEventListener('click', () => {
            clearColumnTimeouts(id); 
            mainNav.classList.remove('expanded-nav');
            mainNav.classList.add('hidden');
            document.getElementById('nav-products-expanded').classList.remove('active');
            document.getElementById('nav-contact-expanded').classList.remove('active');

            topRightLinks.classList.remove('hidden-completely');
            topRightLinks.classList.add('visible-with-animation');

            document.querySelectorAll('.product-column').forEach(c => {
                c.classList.remove('hidden-column', 'expanded', 'shrunk', 'no-hover', 'stay-hover');

                const d = c.querySelector('.detailed-description');
                d.classList.add('hidden');
                d.classList.remove('show');
                d.innerHTML = '';

                const bg = c.querySelector('.background-icons');
                if (bg) bg.style.display = 'none';

                c.querySelector('.view-more-small-button-column').classList.remove('hidden');
                c.querySelector('.add-to-cart-btn').classList.remove('show-btn'); 
                c.querySelector('.add-to-cart-btn').classList.add('hidden');
                c.querySelector('.price-display').textContent = '$80';
                c.querySelectorAll('.quantity-buttons button').forEach(x => {
                    x.classList.remove('active');
                    if (x.textContent.trim() === '3M') x.classList.add('active'); 
                });
                c.querySelector('.advantages-container').classList.remove('show-benefits');
                c.querySelector('.advantages-list').innerHTML = '';
                c.querySelector('.dosages-container').classList.remove('show-benefits');
                c.querySelector('.dosage-list').innerHTML = '';
                c.querySelector('.product-column-image').style.animation = 'none';
                c.querySelector('.product-column-image').style.transform = 'translate(-50%,-50%) scale(1)';
                c.querySelector('.product-column-image').style.top = '43%';
                c.querySelector('.product-column-bg-name').style.opacity = '0';

                c.querySelector('.quantity-buttons').classList.remove('visible-with-animation');
                c.querySelector('.quantity-buttons').classList.add('hidden-with-animation');
                c.querySelector('.price-display').classList.remove('visible-with-animation');
                c.querySelector('.price-display').classList.add('hidden-with-animation');
            });
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        });

        allQtyButtons.forEach(b => {
            b.addEventListener('click', () => {
                priceDisp.textContent = `$${b.getAttribute('data-price')}`;
                allQtyButtons.forEach(x => x.classList.remove('active'));
                b.classList.add('active');
            });
        });

        return col;
    }

    function renderProducts() {
        productColumnsContainer.style.opacity = '0';
        setTimeout(() => {
            document.querySelectorAll('.product-column').forEach(col => {
                clearColumnTimeouts(col.id);
            });

            productColumnsContainer.innerHTML = '';
            const start = currentPage * productsPerPage;
            const end = start + productsPerPage;
            const productsToShow = allProducts.slice(start, end);

            productsToShow.forEach(product => {
                productColumnsContainer.appendChild(createProductColumn(product));
            });

            updateNavigationButtons();
            productColumnsContainer.style.opacity = '1';
        }, 500);
    }

    function updateNavigationButtons() {
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === totalPages - 1;
    }

    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            renderProducts();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            renderProducts();
        }
    });


    renderProducts();
    updateCartCount(); 
});
