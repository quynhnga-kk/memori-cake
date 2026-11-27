const card = document.querySelector('#auth');
const eye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const password = (id, label, autocomplete) => `<div class="password-field"><input id="${id}" name="password" type="password" placeholder="${label}" aria-label="${label}" autocomplete="${autocomplete}" required ${autocomplete === 'new-password' ? 'minlength="8"' : ''}><button class="toggle-password" type="button" aria-label="Hiện mật khẩu" aria-controls="${id}" aria-pressed="false">${eye}</button></div>`;
const socials = '<div class="social-section"><p>hoặc sử dụng tài khoản của bạn</p><div class="social-buttons"><button type="button" class="social" aria-label="Đăng nhập bằng Facebook">f</button><button type="button" class="social" aria-label="Đăng nhập bằng Google">G</button></div></div>';
card.innerHTML = `
<section class="form-panel login-panel" aria-labelledby="login-title"><p class="eyebrow">Memori Cake</p><h1 id="login-title" tabindex="-1">Đăng nhập</h1><form data-form="login"><input name="email" type="email" placeholder="example@email.com" aria-label="Email" autocomplete="email" required>${password('login-password','Nhập mật khẩu','current-password')}<div class="options"><label><input type="checkbox" name="remember"> Ghi nhớ đăng nhập</label><button type="button" class="forgot">Quên mật khẩu?</button></div><button class="primary" type="submit">Đăng nhập</button></form>${socials}<p class="status" role="status"></p></section>
<section class="form-panel register-panel" aria-labelledby="register-title"><p class="eyebrow">Memori Cake</p><h1 id="register-title" tabindex="-1">Đăng ký</h1><form data-form="register"><input name="name" placeholder="Nhập họ và tên" aria-label="Họ và tên" autocomplete="name" required><input name="email" type="email" placeholder="example@email.com" aria-label="Email" autocomplete="email" required>${password('register-password','Tạo mật khẩu (ít nhất 8 ký tự)','new-password')}<button class="primary" type="submit">Đăng ký</button></form>${socials}<p class="status" role="status"></p></section>
<aside class="promo"><div class="promo-content promo-login"><p class="eyebrow">Ngọt ngào từng khoảnh khắc</p><h2>Bắt đầu cùng <span>Memori Cake</span></h2><p>Nếu bạn chưa có tài khoản,<br>đăng ký ngay cùng chúng mình.</p><a class="switch" href="register.html" data-mode="register">Đăng ký</a></div><div class="promo-content promo-register"><p class="eyebrow">Ngọt ngào từng khoảnh khắc</p><h2>Chào mừng <span>đến với </span><span>Memori Cake</span></h2><p>Bạn đã có tài khoản?<br>Đăng nhập để tiếp tục nhé.</p><a class="switch" href="login.html" data-mode="login">Đăng nhập</a></div></aside>`;
function setMode(register, focus = false) {
 card.classList.toggle('is-register', register);
 document.title = `${register ? 'Đăng ký' : 'Đăng nhập'} | Memori Cake`;
 card.querySelector('.login-panel').inert = register;
 card.querySelector('.register-panel').inert = !register;
 card.querySelector('.promo-login').inert = register;
 card.querySelector('.promo-register').inert = !register;
 if (focus) card.querySelector(register ? '#register-title' : '#login-title').focus({preventScroll:true});
}
setMode(location.pathname.endsWith('/register.html'));
card.querySelectorAll('[data-mode]').forEach(link => link.addEventListener('click', event => {
 if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
 event.preventDefault(); history.pushState({},'',link.getAttribute('href')); setMode(link.dataset.mode === 'register',true);
}));
window.addEventListener('popstate',() => setMode(location.pathname.endsWith('/register.html'),true));
card.querySelectorAll('.toggle-password').forEach(button => button.addEventListener('click',() => {
 const input = document.getElementById(button.getAttribute('aria-controls')); const show = input.type === 'password'; input.type = show ? 'text' : 'password'; button.setAttribute('aria-label',show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'); button.setAttribute('aria-pressed',String(show));
}));
// The static site does not have an authentication service connected yet.
card.querySelectorAll('form').forEach(form => form.addEventListener('submit',event => {event.preventDefault(); form.closest('.form-panel').querySelector('.status').textContent = 'Chức năng tài khoản chưa được kết nối máy chủ. Vui lòng thử lại sau.';}));
card.querySelectorAll('.social,.forgot').forEach(button => button.addEventListener('click',() => {button.closest('.form-panel').querySelector('.status').textContent = button.classList.contains('forgot') ? 'Chức năng khôi phục mật khẩu chưa được kết nối. Vui lòng liên hệ cửa hàng để được hỗ trợ.' : 'Đăng nhập mạng xã hội chưa được kết nối. Vui lòng thử lại sau.';}));
