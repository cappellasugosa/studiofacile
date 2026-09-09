(function(){
  const links=document.querySelectorAll('[data-tool-link]');
  links.forEach(a=>a.addEventListener('click',()=>{try{localStorage.setItem('sf-seo-tool',a.dataset.toolLink)}catch(e){}}));
})();
