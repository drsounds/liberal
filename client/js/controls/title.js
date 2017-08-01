define(function () {
	return class SPTitleElement extends HTMLElement {
        attachedCallback() {
            
        }
        setState(object) {
            if (!object) return;
            let title = _(object.name);
            
            if (VERIFIED_PROFILES.filter((o) => (object.id === o)).length > 0) {
                title += ' <i class="fa fa-check-circle new"></i>';
            }
            let titleHTML = '<sp-link uri="' + object.uri + '">' + _(title) + '</sp-link>';
            if (object.artists instanceof Array) {
                titleHTML += ' <span style="opacity: 0.5">' + _('by') + ' ' + object.artists.map(a => {
                    return '<sp-link uri="' + a.uri + '">' + a.name + '</sp-link>';
                }).join(', ') + '</span>';
            }
            if (object.owner) {
                titleHTML += ' <span style="opacity: 0.7"> ' + _('by') + ' <sp-link uri="' + object.owner.uri + '">' + _(object.owner.id) + '</sp-link></span>'; 
            }
            if (object.for) {
                titleHTML += ' <span style="opacity: 0.7"> ' + _('for') + ' <sp-link uri="' + object.for.uri + '">' + _(object.for.name) + '</sp-link></span>'; 
            }
            if (object.in) {
                titleHTML += ' <span style="opacity: 0.7"> ' + _('in') + ' <sp-link uri="' + object.in.uri + '">' + _(object.in.name) + '</sp-link></span>'; 
            }
            if (object.speaker) {
                titleHTML += ' <span style="opacity: 0.7"> ' + _('spoken by') + ' <sp-link uri="' + object.in.uri + '">' + _(object.speaker.name) + '</sp-link></span>'; 
            }
            this.innerHTML = titleHTML;
        }
    }
})