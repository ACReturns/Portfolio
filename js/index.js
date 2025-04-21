// This function displays the first image in the slideshow upon loading the page
var slideIndex = 1;
showSlides(slideIndex);

// This function changes the slide when the left/ right arrow is pressed
function plusSlides(n)
{
    showSlides(slideIndex += n);
}

// This function controls the next/ previous controls when the arrows are clicked
function currentSlide(n)
{
    showSlides(slideIndex = n);
}

function showSlides(n)
{
    // creates an array with the elements from the classes of mySlides & dot 
    var slides = document.getElementsByClassName("mySlides");
    var dots = document.getElementsByClassName("dot");

    // If the parameter is greater than the length of the array "slides", the slideIndex i set to 1
    if (n > slides.length)
    {
        slideIndex = 1;
    }
    // If the parameter is less than 1, the slideIndex is set to the length of the array
    if (n < 1)
    {
        slideIndex = slides.length;
    }
    // This for loop takes each item in the array "slides" and sets the display to none
    for (i = 0; i < slides.length; i++)
    {
        slides[i].style.display = "none";
    }
    // This for loop takes each item in the array "dots" and removes "active" which removes the active styling
    for (i = 0; i < dots.length; i++)
    {
        dots[i].className = dots[i].className.replace(" active", "");
    }

    slides[slideIndex - 1].style.display = "block"; // Display the image in the slideshow
    dots[slideIndex -1].className += " active"; // Adds the active styling to the dot associated with the image
}

// These functions open & close the contact form
function openForm()
{
    document.getElementById("myForm").style.display = "block";
}

function closeForm()
{
    document.getElementById("myForm").style.display = "none";
}

// This code will close the contact form when the user clicks off of it.
document.addEventListener("click", function(event)
{
    /* After creating a event listener, we check here if the Cancel button is hit OR that the click happens outside of the contact 
    form and that it doesnt happen on any element within the contact form. If so then we call the closeForm() function */
    if (event.target.matches(".cancel") || !event.target.closest(".form-popup") && !event.target.closest(".Pop_Up_Button") && !event.target.closest(".contact"))
    {
        closeForm()
    }
}, false)

// Collapsible function for projects
var coll = document.getElementsByClassName("collapsible");
var activeProject = false;
var openProject;

for (var i = 0; i < coll.length; i++) 
    {
        coll[i].addEventListener("click", function() 
        {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            
            if (openProject != null && openProject.style.display == "block")
            {
                openProject.classList.toggle("collapsible")
                openProject.style.display = "none";
                activeProject = false;
            }
            // If original tab is selected then just collapse it, otherwise open new tab and close old one
            if (content == openProject)
            {
                content.style.display = "none";
                openProject = null;
            }
            else if (content.style.display === "block") 
                {
                    content.style.display = "none";
                } 
                else 
                {
                    content.style.display = "block";
                    openProject = content;
                    activeProject = true;
                }

        });
    }