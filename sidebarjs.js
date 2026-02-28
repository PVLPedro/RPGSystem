const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');
let sidebarMode = localStorage.getItem('sidebar-mode');

const enableSidebarMode = () => {
	sidebar.classList.toggle('close');
	toggleButton.classList.toggle('rotate');
	
	localStorage.setItem('sidebar-mode', 'active');
	}
	const disableSidebarMode = () => {
	sidebar.classList.toggle('close');
	toggleButton.classList.toggle('rotate');
	
	localStorage.setItem('sidebar-mode', null);
	}
	document.addEventListener('keydown', function(event) {
	if ((event.shiftKey) && event.key.toLowerCase() === 's') {
		toggleSidebar()
	}
});

if (sidebarMode === "active") enableSidebarMode();

toggleButton.addEventListener('click', () => {
    toggleSidebar()
})

function toggleSidebar() {
    sidebarMode = localStorage.getItem('sidebar-mode')
    if (sidebarMode !== 'active') {
        enableSidebarMode()
    }
    else {
        disableSidebarMode()
    }
}