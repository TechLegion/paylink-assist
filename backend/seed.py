import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile, Task, EscrowTransaction
from decimal import Decimal

users_data = [
    ('alex_thompson', 'Alex', 'Thompson', 4.9, 87),
    ('sarah_jenkins', 'Sarah', 'Jenkins', 4.9, 42),
    ('john_doe', 'John', 'Doe', 4.7, 23),
    ('mike_t', 'Mike', 'Torres', 4.8, 31),
    ('julian_rivera', 'Julian', 'Rivera', 4.9, 124),
]

profiles = {}
for username, first, last, rating, reviews in users_data:
    user, _ = User.objects.get_or_create(username=username)
    user.first_name = first
    user.last_name = last
    user.save()
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.is_verified = True
    profile.rating = Decimal(str(rating))
    profile.reviews_count = reviews
    profile.save()
    profiles[username] = profile

tasks_data = [
    ('Help Moving Furniture', 'Need help moving heavy furniture from a 3rd floor apartment. Items include a sofa, dining table, and 3 bedroom sets. Must be able to lift safely.', 'Moving & Packing', 'HIGH', '120.00', 'Brooklyn, NY 11211', 'john_doe', None, 'OPEN'),
    ('Grocery Delivery', 'Need someone to pick up groceries from Whole Foods on 97th St and deliver to my apartment. I will provide the list and payment for groceries upfront.', 'Shopping', 'MEDIUM', '35.00', 'Manhattan, NY 10001', 'sarah_jenkins', None, 'OPEN'),
    ('IKEA Desk Assembly', 'Looking for someone to assemble an IKEA MALM desk and BILLY bookcase. Tools provided. Should take about 2 hours for an experienced person.', 'Assembly', 'LOW', '65.00', 'Brooklyn, NY 11215', 'mike_t', None, 'OPEN'),
    ('Assemble IKEA Desk & Bookshelf', 'Looking for someone experienced in flat-pack furniture assembly. Large MALM desk and BILLY bookcase need to be put together. Must bring own screwdriver and hex keys.', 'Furniture Assembly', 'LOW', '120.00', 'Brooklyn, NY 11211', 'sarah_jenkins', None, 'OPEN'),
    ('Office Cleaning Service', 'Need a thorough office cleaning including vacuuming, mopping, bathroom cleaning, and kitchen. Office is approximately 1200 sq ft.', 'Cleaning', 'MEDIUM', '80.00', 'Manhattan, NY 10016', 'alex_thompson', None, 'OPEN'),
    ('Plumbing Repair', 'Leaking pipe under the kitchen sink needs fixing. Also the bathroom faucet drips. Must be a licensed plumber or experienced handyman.', 'Maintenance', 'HIGH', '150.00', 'Queens, NY 11435', 'john_doe', None, 'OPEN'),
    ('Modern Garden Landscaping', 'Full backyard redesign including minimalist paving, native plant installation, and smart irrigation setup. Completed according to the agreed architectural plan.', 'Landscaping', 'LOW', '1200.00', 'Queens, NY 11435', 'alex_thompson', 'julian_rivera', 'COMPLETED'),
]

for title, desc, category, urgency, budget, location, poster_key, worker_key, status in tasks_data:
    poster = profiles[poster_key]
    worker = profiles[worker_key] if worker_key else None
    task, created = Task.objects.get_or_create(title=title, defaults={
        'description': desc, 'category': category, 'urgency': urgency,
        'budget': Decimal(budget), 'location': location,
        'poster': poster, 'worker': worker, 'status': status,
    })

completed = Task.objects.filter(status='COMPLETED').first()
if completed:
    EscrowTransaction.objects.get_or_create(
        task=completed,
        defaults={'amount': Decimal('1691.25'), 'status': 'HELD', 'payaza_reference': 'PAY-REF-2024-001'},
    )

print('Seed data created successfully!')
