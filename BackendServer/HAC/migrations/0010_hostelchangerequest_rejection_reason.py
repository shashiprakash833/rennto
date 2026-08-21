from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('HAC', '0009_merge_20260818_1635'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='hostelchangerequest',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='hostelchangerequest',
            name='rejection_reason',
            field=models.TextField(blank=True, null=True),
        ),
    ]
